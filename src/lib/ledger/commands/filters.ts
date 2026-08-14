import type { CommandFilters } from "@/lib/ledger/commands/types";
import type {
  AccountCategory,
  LedgerAccount,
  LedgerEntryRecord,
} from "@/lib/ledger/types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ACCOUNT_CATEGORIES: AccountCategory[] = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
];

function cleanString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeCommandFilters(
  filters: CommandFilters,
  accounts: LedgerAccount[],
): CommandFilters {
  const allowedAccounts = new Set(accounts.map((account) => account.name));

  const normalized: CommandFilters = {
    accountCategory:
      filters.accountCategory &&
      ACCOUNT_CATEGORIES.includes(filters.accountCategory)
        ? filters.accountCategory
        : null,
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
    payee: cleanString(filters.payee),
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

function entrySearchText(entry: LedgerEntryRecord) {
  return [
    entry.description,
    entry.sourcePrompt,
    entry.metadata.vendorName,
    entry.metadata.paymentMethod,
    entry.metadata.reference,
    entry.metadata.notes,
    entry.beancountText,
    ...entry.postings.map((posting) => posting.account),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function entryPayeeText(entry: LedgerEntryRecord) {
  return [entry.description, entry.metadata.vendorName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function entryLargestPostingAmount(entry: LedgerEntryRecord) {
  return Math.max(...entry.postings.map((posting) => Math.abs(posting.amount)), 0);
}

function matchesPayee(entry: LedgerEntryRecord, payee: string) {
  const needle = payee.toLowerCase();
  return entryPayeeText(entry).includes(needle);
}

function entryMatchesAccountCategory(
  entry: LedgerEntryRecord,
  category: AccountCategory,
  accounts: LedgerAccount[],
) {
  const categoriesByAccount = new Map(
    accounts.map((account) => [account.name, account.category]),
  );

  return entry.postings.some(
    (posting) => categoriesByAccount.get(posting.account) === category,
  );
}

export function filterLedgerEntries(
  entries: LedgerEntryRecord[],
  filters: CommandFilters,
  accounts: LedgerAccount[] = [],
) {
  return entries.filter((entry) => {
    const searchableText = entrySearchText(entry);
    const matchesSearch = filters.searchText
      ? searchableText.includes(filters.searchText.toLowerCase())
      : true;
    const matchesVendor = filters.vendorName
      ? entry.metadata.vendorName
          ?.toLowerCase()
          .includes(filters.vendorName.toLowerCase()) ?? false
      : true;
    const matchesPayeeFilter = filters.payee ? matchesPayee(entry, filters.payee) : true;
    const matchesAccount = filters.accountName
      ? entry.postings.some((posting) => posting.account === filters.accountName)
      : true;
    const matchesAccountCategory = filters.accountCategory
      ? entryMatchesAccountCategory(entry, filters.accountCategory, accounts)
      : true;
    const matchesStartDate = filters.startDate
      ? entry.entryDate >= filters.startDate
      : true;
    const matchesEndDate = filters.endDate ? entry.entryDate <= filters.endDate : true;
    const largestPostingAmount = entryLargestPostingAmount(entry);
    const matchesMinAmount = filters.minAmount
      ? largestPostingAmount >= filters.minAmount
      : true;
    const matchesMaxAmount = filters.maxAmount
      ? largestPostingAmount <= filters.maxAmount
      : true;

    return (
      matchesSearch &&
      matchesVendor &&
      matchesPayeeFilter &&
      matchesAccount &&
      matchesAccountCategory &&
      matchesStartDate &&
      matchesEndDate &&
      matchesMinAmount &&
      matchesMaxAmount
    );
  });
}

export function entriesForBalance(entries: LedgerEntryRecord[]) {
  return entries.filter((entry) => entry.status !== "reversed");
}

export function entriesForActiveTotals(entries: LedgerEntryRecord[]) {
  return entries.filter(
    (entry) => entry.status !== "reversed" && !entry.reversalOfEntryId,
  );
}

export function sumEntryAmount(
  entry: LedgerEntryRecord,
  filters: CommandFilters,
  accounts: LedgerAccount[],
) {
  if (filters.accountName) {
    return entry.postings
      .filter((posting) => posting.account === filters.accountName)
      .reduce((total, posting) => total + posting.amount, 0);
  }

  if (filters.accountCategory) {
    const categoriesByAccount = new Map(
      accounts.map((account) => [account.name, account.category]),
    );

    return entry.postings
      .filter(
        (posting) => categoriesByAccount.get(posting.account) === filters.accountCategory,
      )
      .reduce((total, posting) => total + Math.abs(posting.amount), 0);
  }

  return Math.max(...entry.postings.map((posting) => Math.abs(posting.amount)), 0);
}

export function collectKnownPayees(entries: LedgerEntryRecord[]) {
  const payees = new Set<string>();

  for (const entry of entries) {
    if (entry.metadata.vendorName?.trim()) {
      payees.add(entry.metadata.vendorName.trim());
    }

    const description = entry.description.trim();
    if (description) {
      payees.add(description.split(" - ")[0]?.trim() || description);
    }
  }

  return [...payees].sort((left, right) => left.localeCompare(right));
}

export function collectKnownNotePhrases(entries: LedgerEntryRecord[]) {
  const notes = new Set<string>();

  for (const entry of entries) {
    const note = entry.metadata.notes?.trim();
    if (note) {
      notes.add(note);
    }
  }

  return [...notes].sort((left, right) => left.localeCompare(right));
}
