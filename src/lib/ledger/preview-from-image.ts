import {
  mapStructuredEntriesToPreviews,
  structuredEntrySchema,
} from "@/lib/ledger/preview";
import type {
  LedgerAccount,
  LedgerEntryPreview,
  LedgerSummary,
  StructuredLedgerEntry,
} from "@/lib/ledger/types";
import {
  DEFAULT_OPENAI_VISION_MODEL,
  createOpenAIClient,
} from "@/lib/openai";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type GeneratePreviewFromImageParams = {
  accounts: LedgerAccount[];
  imageBase64: string;
  imageMimeType: string;
  ledger: LedgerSummary;
};

function buildPreviewSystemInstructions(
  ledger: LedgerSummary,
  accountNames: string[],
  today: string,
) {
  return [
    "You are an accounting assistant that reads receipt photos and creates Beancount-compatible double-entry journal entries.",
    "Read all visible text from the receipt image carefully, including faded thermal print.",
    "Return usually one entry unless the receipt clearly shows multiple separate transactions.",
    "Use the receipt date when visible; otherwise use today.",
    "Put merchant or store name in metadata.vendorName.",
    "Put card brand, cash, transfer, or payment method in metadata.paymentMethod when visible.",
    "Put receipt or invoice numbers in metadata.reference when visible.",
    "Put item summaries or extra context in metadata.notes when useful.",
    "Use the total paid amount from the receipt, not subtotal, unless only subtotal is visible.",
    "Also return a short extractedText summary of what you read from the receipt.",
    `Every posting account must be copied exactly from this list: ${accountNames.join(", ")}.`,
    "Never invent, rename, or guess account names.",
    "Never use Income accounts for money going out.",
    "Salary advance is always Assets:SalaryAdvance. Never use Expenses:SalaryAdvance.",
    "Map salary advance to Assets:SalaryAdvance.",
    ledger.bookType === "personal"
      ? "Map maid, nanny, domestic worker, and wage payments to Expenses:HouseholdStaff."
      : "Map employee and payroll wages to Expenses:Payroll.",
    ledger.bookType === "personal"
      ? "Map handyman, repairs, and maintenance to Expenses:HomeMaintenance."
      : "Map handyman and contractor payments to Expenses:Contractors or Expenses:Payroll.",
    ledger.bookType === "personal"
      ? "Map generic personal spending to Expenses:Shopping unless clearly household staff, maintenance, or an advance."
      : "Map generic expense lines to the closest matching expense account.",
    "Put the payee in metadata.vendorName only, not combined with role text.",
    "Use a short purpose phrase for description.",
    "Map card or cash payments to Assets:Cash or the closest matching asset account with a negative amount for outflows.",
    `Use ${ledger.defaultCurrency} as the default currency unless the receipt clearly specifies another currency.`,
    `If the receipt does not provide a date, use ${today}.`,
    "Extract vendorName, paymentMethod, reference, and notes when they are reasonably clear; otherwise return null for those fields.",
    "Return JSON only.",
    "All posting amounts must be explicit numeric values and every entry must balance to zero.",
  ].join(" ");
}

export function validateReceiptImage(file: Pick<File, "size" | "type">) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, or WebP.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum size is 10 MB.");
  }
}

export async function generateLedgerPreviewFromImage({
  accounts,
  imageBase64,
  imageMimeType,
  ledger,
}: GeneratePreviewFromImageParams): Promise<LedgerEntryPreview[]> {
  const client = createOpenAIClient();
  const today = new Date().toISOString().slice(0, 10);
  const accountNames = accounts.map((account) => account.name);
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_VISION_MODEL,
    messages: [
      {
        role: "system",
        content: buildPreviewSystemInstructions(ledger, accountNames, today),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              availableAccounts: accounts.map((account) => ({
                category: account.category,
                description: account.description ?? null,
                name: account.name,
              })),
              bookType: ledger.bookType,
              defaultCurrency: ledger.defaultCurrency,
              instruction: "Interpret this receipt photo into ledger entry previews.",
              today,
            }),
          },
          {
            type: "image_url",
            image_url: {
              detail: "high",
              url: `data:${imageMimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ledger_entry_previews_from_receipt",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            extractedText: { type: "string" },
            entries: {
              type: "array",
              minItems: 1,
              items: structuredEntrySchema,
            },
          },
          required: ["extractedText", "entries"],
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI did not return a structured receipt preview.");
  }

  const parsed = JSON.parse(rawContent) as {
    entries?: StructuredLedgerEntry[];
    extractedText?: string;
  };

  if (!parsed.entries?.length) {
    throw new Error("OpenAI did not return any ledger entries from the receipt.");
  }

  const extractedText = parsed.extractedText?.trim() || "Receipt photo";
  const sourcePrompt = `Receipt: ${extractedText}`;

  return mapStructuredEntriesToPreviews(
    parsed.entries,
    accounts,
    ledger,
    sourcePrompt,
    DEFAULT_OPENAI_VISION_MODEL,
  );
}
