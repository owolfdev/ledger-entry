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
