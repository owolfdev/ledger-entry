import { analyzePromptSegmentation } from "@/lib/ledger/segmentation";
import type {
  LedgerAccount,
  LedgerEntryMetadata,
  LedgerEntryPreview,
  LedgerSummary,
  StructuredLedgerEntry,
} from "@/lib/ledger/types";
import { DEFAULT_OPENAI_MODEL, createOpenAIClient } from "@/lib/openai";

const ENTRY_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ACCOUNT_ALIASES: Record<string, string> = {
  "Expenses:Salary": "Expenses:HouseholdStaff",
  "Expenses:SalaryAdvance": "Assets:SalaryAdvance",
  "Expenses:Wages": "Expenses:HouseholdStaff",
};

function resolveAccountName(name: string, allowedAccounts: Set<string>) {
  if (allowedAccounts.has(name)) {
    return name;
  }

  const alias = ACCOUNT_ALIASES[name];

  if (alias && allowedAccounts.has(alias)) {
    return alias;
  }

  return name;
}

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
  const normalizedPostings = entry.postings.map((posting) => ({
    ...posting,
    account: resolveAccountName(posting.account, allowedAccounts),
  }));

  normalizedPostings.forEach((posting) => {
    if (!allowedAccounts.has(posting.account)) {
      throw new Error(`Unknown account "${posting.account}" returned by the model.`);
    }

    if (!Number.isFinite(posting.amount) || posting.amount === 0) {
      throw new Error(`Invalid posting amount for "${posting.account}".`);
    }
  });

  const total = normalizedPostings.reduce((sum, posting) => sum + posting.amount, 0);

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
    postings: normalizedPostings,
  };
}

export const structuredEntrySchema = {
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
  required: ["entryDate", "description", "currency", "metadata", "postings"],
} as const;

export function mapStructuredEntriesToPreviews(
  entries: StructuredLedgerEntry[],
  accounts: LedgerAccount[],
  ledger: LedgerSummary,
  sourcePrompt: string,
  model: string,
): LedgerEntryPreview[] {
  const entryCount = entries.length;

  return entries.map((entry, index) => {
    try {
      const validatedEntry = validateStructuredEntry(entry, accounts);

      return {
        beancountText: buildBeancountEntry(validatedEntry),
        entry: validatedEntry,
        ledger,
        model,
        sourcePrompt,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to validate ledger entry.";
      throw new Error(
        entryCount > 1 ? `Entry ${index + 1}: ${message}` : message,
      );
    }
  });
}

function buildPreviewSystemInstructions(
  ledger: LedgerSummary,
  accountNames: string[],
  today: string,
  extraInstructions: string[] = [],
) {
  return [
    "You are an accounting assistant that creates Beancount-compatible double-entry journal entries.",
    ...extraInstructions,
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
      ? "Map generic personal spending lines in a compound payment to Expenses:Shopping unless clearly household staff, maintenance, or an advance."
      : "Map generic expense lines to the closest matching expense account.",
    "Put the payee in metadata.vendorName only, not combined with role text.",
    "Put role or job context such as maid or handyman in metadata.notes when clear.",
    "Lines like 'notes: handyman' belong in metadata.notes.",
    "Use a short purpose phrase for description, such as 'Maid payment' or 'Salary advance'.",
    "Map cash payments to Assets:Cash with a negative amount for outflows.",
    `Use ${ledger.defaultCurrency} as the default currency unless the prompt clearly specifies another currency.`,
    `If the user does not provide a date, use ${today}.`,
    "Extract vendorName, paymentMethod, reference, and notes when they are reasonably clear; otherwise return null for those fields.",
    "Return JSON only.",
    "All posting amounts must be explicit numeric values and every entry must balance to zero.",
  ].join(" ");
}

export async function generateLedgerPreview({
  accounts,
  ledger,
  prompt,
}: GeneratePreviewParams): Promise<LedgerEntryPreview[]> {
  const client = createOpenAIClient();
  const today = new Date().toISOString().slice(0, 10);
  const segmentation = analyzePromptSegmentation(prompt);
  const accountNames = accounts.map((account) => account.name);
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: buildPreviewSystemInstructions(ledger, accountNames, today, [
          "Decide whether the prompt is one compound entry or several separate entries.",
          "Return multiple entries when the prompt lists complete transactions, especially when dates differ or each line restates a payee plus amount plus date.",
          "Return exactly one entry with multiple postings when one payee and one date apply to several amount lines, such as a shared vendor header and a shared date around amount-only lines.",
          "Do not split a compound payment just because it has more than one amount.",
          "Do not merge complete transactions that have different dates.",
          "If segmentation.hint is multiple, return one entry per transaction.",
          "If segmentation.hint is compound, return exactly one entry and post every amount line inside it.",
          "If segmentation.hint is single, return exactly one entry.",
          "If segmentation.hint is unclear, apply the split-versus-compound rules above.",
          "For a compound payment, post the cash or bank account for the total and each line item to its destination account.",
        ]),
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
          segmentation,
          today,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ledger_entry_previews",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            entries: {
              type: "array",
              minItems: 1,
              items: structuredEntrySchema,
            },
          },
          required: ["entries"],
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI did not return a structured ledger preview.");
  }

  const parsed = JSON.parse(rawContent) as { entries?: StructuredLedgerEntry[] };

  if (!parsed.entries?.length) {
    throw new Error("OpenAI did not return any ledger entries.");
  }

  return mapStructuredEntriesToPreviews(
    parsed.entries,
    accounts,
    ledger,
    prompt,
    DEFAULT_OPENAI_MODEL,
  );
}
