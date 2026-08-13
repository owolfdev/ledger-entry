export type BookType = "business" | "personal";

export type AccountCategory =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense";

export type LedgerSummary = {
  bookType: BookType;
  defaultCurrency: string;
  id: string;
  name: string;
  slug: string;
};

export type LedgerAccount = {
  category: AccountCategory;
  description?: string | null;
  id?: string;
  name: string;
};

export type StructuredPosting = {
  account: string;
  amount: number;
};

export type LedgerEntryMetadata = {
  notes?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  vendorName?: string | null;
};

export type StructuredLedgerEntry = {
  currency: string;
  description: string;
  entryDate: string;
  metadata?: LedgerEntryMetadata;
  postings: StructuredPosting[];
};

export type LedgerEntryPreview = {
  beancountText: string;
  entry: StructuredLedgerEntry;
  ledger: LedgerSummary;
  model: string;
  sourcePrompt: string;
};

export type LedgerEntryRecord = {
  beancountText: string;
  createdAt: string;
  currency: string;
  description: string;
  entryDate: string;
  id: string;
  metadata: LedgerEntryMetadata;
  modelName: string;
  postings: StructuredPosting[];
  reversalOfEntryId?: string | null;
  reversedByEntryId?: string | null;
  sourcePrompt: string;
  status: "confirmed" | "reversed";
};

export type JournalQueryFilters = {
  accountCategory?: AccountCategory | null;
  accountName?: string | null;
  endDate?: string | null;
  maxAmount?: number | null;
  minAmount?: number | null;
  payee?: string | null;
  searchText?: string | null;
  startDate?: string | null;
  vendorName?: string | null;
};
