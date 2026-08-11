import type {
  JournalQueryFilters,
  LedgerAccount,
  LedgerSummary,
} from "@/lib/ledger/types";
import { DEFAULT_OPENAI_MODEL, createOpenAIClient } from "@/lib/openai";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type BuildJournalQueryParams = {
  accounts: LedgerAccount[];
  ledger: LedgerSummary;
  prompt: string;
};

function cleanString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeJournalQueryFilters(
  filters: JournalQueryFilters,
  accounts: LedgerAccount[],
) {
  const allowedAccounts = new Set(accounts.map((account) => account.name));
  const normalized: JournalQueryFilters = {
    accountName:
      filters.accountName && allowedAccounts.has(filters.accountName)
        ? filters.accountName
        : null,
    endDate:
      filters.endDate && DATE_REGEX.test(filters.endDate) ? filters.endDate : null,
    maxAmount:
      typeof filters.maxAmount === "number" && Number.isFinite(filters.maxAmount)
        ? Math.abs(filters.maxAmount)
        : null,
    minAmount:
      typeof filters.minAmount === "number" && Number.isFinite(filters.minAmount)
        ? Math.abs(filters.minAmount)
        : null,
    searchText: cleanString(filters.searchText),
    startDate:
      filters.startDate && DATE_REGEX.test(filters.startDate)
        ? filters.startDate
        : null,
    vendorName: cleanString(filters.vendorName),
  };

  if (
    normalized.minAmount &&
    normalized.maxAmount &&
    normalized.minAmount > normalized.maxAmount
  ) {
    const currentMin = normalized.minAmount;
    normalized.minAmount = normalized.maxAmount;
    normalized.maxAmount = currentMin;
  }

  return normalized;
}

export async function buildJournalQueryFilters({
  accounts,
  ledger,
  prompt,
}: BuildJournalQueryParams) {
  const client = createOpenAIClient();
  const today = new Date().toISOString().slice(0, 10);
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "You translate natural-language ledger search prompts into structured journal filters.",
          "Use only the supplied account names when choosing an accountName.",
          "If the prompt does not clearly specify a filter, return null for that field.",
          `Use ${today} as the reference date for relative periods like 'last month' or 'this week'.`,
          "Amounts should be positive numbers representing absolute value thresholds.",
          "Return JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          availableAccounts: accounts.map((account) => account.name),
          defaultCurrency: ledger.defaultCurrency,
          ledgerName: ledger.name,
          prompt,
          today,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "journal_query_filters",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            accountName: { type: ["string", "null"] },
            endDate: { type: ["string", "null"] },
            maxAmount: { type: ["number", "null"] },
            minAmount: { type: ["number", "null"] },
            searchText: { type: ["string", "null"] },
            startDate: { type: ["string", "null"] },
            vendorName: { type: ["string", "null"] },
          },
          required: [
            "accountName",
            "endDate",
            "maxAmount",
            "minAmount",
            "searchText",
            "startDate",
            "vendorName",
          ],
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI did not return structured journal filters.");
  }

  const parsedFilters = JSON.parse(rawContent) as JournalQueryFilters;

  return {
    filters: normalizeJournalQueryFilters(parsedFilters, accounts),
    model: DEFAULT_OPENAI_MODEL,
  };
}
