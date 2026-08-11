import type {
  LedgerAccount,
  LedgerEntryMetadata,
  LedgerEntryPreview,
  LedgerSummary,
  StructuredLedgerEntry,
} from "@/lib/ledger/types";
import { DEFAULT_OPENAI_MODEL, createOpenAIClient } from "@/lib/openai";

const ENTRY_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type GeneratePreviewParams = {
  accounts: LedgerAccount[];
  ledger: LedgerSummary;
  prompt: string;
};

function formatAmount(amount: number) {
  return amount.toFixed(2);
}

function cleanMetadataValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function escapeMetadataValue(value: string) {
  return value.replaceAll('"', '\\"');
}

export function buildBeancountEntry(entry: StructuredLedgerEntry) {
  const longestAccountName = entry.postings.reduce(
    (max, posting) => Math.max(max, posting.account.length),
    0,
  );
  const metadataLines = Object.entries(entry.metadata ?? {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `  ${key}: "${escapeMetadataValue(String(value))}"`)
    .join("\n");

  const postings = entry.postings
    .map((posting) => {
      const paddedAccount = posting.account.padEnd(longestAccountName + 2, " ");
      return `  ${paddedAccount}${formatAmount(posting.amount)} ${entry.currency}`;
    })
    .join("\n");

  const body = [metadataLines, postings].filter(Boolean).join("\n");

  return `${entry.entryDate} * "${entry.description}"\n${body}`;
}

export function validateStructuredEntry(
  entry: StructuredLedgerEntry,
  accounts: LedgerAccount[],
) {
  if (!ENTRY_DATE_REGEX.test(entry.entryDate)) {
    throw new Error("Ledger entry date must use YYYY-MM-DD format.");
  }

  if (!entry.description.trim()) {
    throw new Error("Ledger entry description cannot be empty.");
  }

  if (entry.postings.length < 2) {
    throw new Error("Ledger entry must include at least two postings.");
  }

  const allowedAccounts = new Set(accounts.map((account) => account.name));

  entry.postings.forEach((posting) => {
    if (!allowedAccounts.has(posting.account)) {
      throw new Error(`Unknown account "${posting.account}" returned by the model.`);
    }

    if (!Number.isFinite(posting.amount) || posting.amount === 0) {
      throw new Error(`Invalid posting amount for "${posting.account}".`);
    }
  });

  const total = entry.postings.reduce((sum, posting) => sum + posting.amount, 0);

  if (Math.abs(total) > 0.001) {
    throw new Error("Ledger entry postings must balance to zero.");
  }

  const metadata: LedgerEntryMetadata = {
    notes: cleanMetadataValue(entry.metadata?.notes),
    paymentMethod: cleanMetadataValue(entry.metadata?.paymentMethod),
    reference: cleanMetadataValue(entry.metadata?.reference),
    vendorName: cleanMetadataValue(entry.metadata?.vendorName),
  };

  return {
    ...entry,
    currency: entry.currency.toUpperCase(),
    description: entry.description.trim(),
    metadata,
  };
}

export async function generateLedgerPreview({
  accounts,
  ledger,
  prompt,
}: GeneratePreviewParams): Promise<LedgerEntryPreview> {
  const client = createOpenAIClient();
  const today = new Date().toISOString().slice(0, 10);
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "You are an accounting assistant that creates a single Beancount-compatible double-entry journal entry.",
          "Use only the supplied account names.",
          "Never invent accounts.",
          `Use ${ledger.defaultCurrency} as the default currency unless the prompt clearly specifies another currency.`,
          `If the user does not provide a date, use ${today}.`,
          "Extract vendorName, paymentMethod, reference, and notes when they are reasonably clear; otherwise return null for those fields.",
          "Return JSON only.",
          "All posting amounts must be explicit numeric values and must balance to zero.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          availableAccounts: accounts.map((account) => ({
            category: account.category,
            description: account.description ?? null,
            name: account.name,
          })),
          bookType: ledger.bookType,
          defaultCurrency: ledger.defaultCurrency,
          prompt,
          today,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ledger_entry_preview",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            entryDate: { type: "string" },
            description: { type: "string" },
            currency: { type: "string" },
            metadata: {
              type: "object",
              additionalProperties: false,
              properties: {
                vendorName: { type: ["string", "null"] },
                paymentMethod: { type: ["string", "null"] },
                reference: { type: ["string", "null"] },
                notes: { type: ["string", "null"] },
              },
              required: ["vendorName", "paymentMethod", "reference", "notes"],
            },
            postings: {
              type: "array",
              minItems: 2,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  account: { type: "string" },
                  amount: { type: "number" },
                },
                required: ["account", "amount"],
              },
            },
          },
          required: [
            "entryDate",
            "description",
            "currency",
            "metadata",
            "postings",
          ],
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI did not return a structured ledger preview.");
  }

  const parsedEntry = JSON.parse(rawContent) as StructuredLedgerEntry;
  const validatedEntry = validateStructuredEntry(parsedEntry, accounts);

  return {
    beancountText: buildBeancountEntry(validatedEntry),
    entry: validatedEntry,
    ledger,
    model: DEFAULT_OPENAI_MODEL,
    sourcePrompt: prompt,
  };
}
