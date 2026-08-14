import type { CommandFilters, CommandName } from "@/lib/ledger/commands/types";
import type { AccountCategory } from "@/lib/ledger/types";

const CATEGORY_KEYWORDS: Record<string, AccountCategory> = {
  asset: "asset",
  assets: "asset",
  equity: "equity",
  expense: "expense",
  expenses: "expense",
  income: "income",
  liability: "liability",
  liabilities: "liability",
};

const TRAILING_CLAUSE_PATTERN =
  /\s+(?:in|during|from|between|this|last|on|before|after)\s+.+$/i;

function cleanSearchPhrase(value: string) {
  return value
    .replace(TRAILING_CLAUSE_PATTERN, "")
    .replace(/[?.!,;]+$/, "")
    .trim();
}

function extractNotesPhrase(prompt: string) {
  const match = prompt.match(/\bnotes?\s*:\s*(.+)$/i);

  if (!match?.[1]) {
    return null;
  }

  const phrase = cleanSearchPhrase(match[1]);
  return phrase || null;
}

function extractForPhrase(prompt: string) {
  const match = prompt.match(/\bfor\s+(?:the\s+)?(.+)$/i);

  if (!match?.[1]) {
    return null;
  }

  const phrase = cleanSearchPhrase(match[1]);

  if (!phrase || CATEGORY_KEYWORDS[phrase.toLowerCase()]) {
    return null;
  }

  return phrase;
}

function extractAboutPhrase(prompt: string) {
  const match =
    prompt.match(/\b(?:about|regarding|labeled|tagged|noted as)\s+(?:the\s+)?(.+)$/i) ??
    prompt.match(/\bproject\s+(?:called\s+)?(.+)$/i);

  if (!match?.[1]) {
    return null;
  }

  const phrase = cleanSearchPhrase(match[1]);
  return phrase || null;
}

function promptMentionsExpenses(prompt: string) {
  return /\bexpenses?\b/i.test(prompt);
}

function isSuspiciousPayee(payee: string) {
  const lower = payee.trim().toLowerCase();

  return (
    /\bexpenses?\b/.test(lower) ||
    /\bnotes?\s*:/.test(lower) ||
    /\ball\b/.test(lower) ||
    /\bfor\b/.test(lower) ||
    /\bproject\b/.test(lower) ||
    lower.split(/\s+/).length > 3
  );
}

function sanitizePayee(
  payee: string | null | undefined,
  derivedSearchText: string | null,
  promptDerivedSearch: boolean,
) {
  if (!payee?.trim()) {
    return null;
  }

  const trimmed = payee.trim();

  if (isSuspiciousPayee(trimmed)) {
    return null;
  }

  if (promptDerivedSearch) {
    return null;
  }

  if (derivedSearchText && trimmed.toLowerCase().includes(derivedSearchText.toLowerCase())) {
    return null;
  }

  return trimmed;
}

function deriveSearchText(prompt: string, existing: string | null | undefined) {
  const notesPhrase = extractNotesPhrase(prompt);
  const forPhrase = extractForPhrase(prompt);
  const aboutPhrase = extractAboutPhrase(prompt);
  const promptDerivedSearch = Boolean(notesPhrase || forPhrase || aboutPhrase);
  const searchText =
    existing?.trim() || notesPhrase || forPhrase || aboutPhrase || null;

  return {
    promptDerivedSearch,
    searchText,
  };
}

export function augmentFiltersFromPrompt(
  prompt: string,
  command: CommandName,
  filters: CommandFilters,
): CommandFilters {
  const augmented: CommandFilters = { ...filters };
  const { promptDerivedSearch, searchText } = deriveSearchText(
    prompt,
    augmented.searchText,
  );

  if (promptMentionsExpenses(prompt) && !augmented.accountCategory) {
    augmented.accountCategory = "expense";
  }

  if (searchText) {
    augmented.searchText = searchText;
  }

  augmented.payee = sanitizePayee(
    augmented.payee,
    augmented.searchText ?? null,
    promptDerivedSearch,
  );

  if (
    augmented.searchText &&
    augmented.payee &&
    augmented.searchText.toLowerCase() === augmented.payee.toLowerCase()
  ) {
    augmented.payee = null;
  }

  if (command === "sum" && augmented.searchText && !augmented.accountCategory) {
    if (promptMentionsExpenses(prompt)) {
      augmented.accountCategory = "expense";
    }
  }

  return augmented;
}
