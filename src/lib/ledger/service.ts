import { buildBeancountEntry } from "@/lib/ledger/preview";
import { applyEntryLabels, type EntryLabelValues } from "@/lib/ledger/entry-labels";
import { STARTER_LEDGER_TEMPLATES } from "@/lib/ledger/starter-ledgers";
import type {
  LedgerAccount,
  LedgerEntryRecord,
  LedgerSummary,
  StructuredLedgerEntry,
} from "@/lib/ledger/types";
import { createAdminClient } from "@/lib/supabase/admin";

type LedgerRow = {
  book_type: LedgerSummary["bookType"];
  default_currency: string;
  id: string;
  name: string;
  slug: string;
};

type LedgerEntryRow = {
  beancount_text: string;
  created_at: string;
  currency: string;
  description: string;
  entry_date: string;
  id: string;
  metadata: LedgerEntryRecord["metadata"] | null;
  model_name: string;
  postings: LedgerEntryRecord["postings"];
  reversal_of_entry_id: string | null;
  reversed_by_entry_id: string | null;
  status: LedgerEntryRecord["status"];
  source_prompt: string;
};

function mapLedger(row: LedgerRow): LedgerSummary {
  return {
    bookType: row.book_type,
    defaultCurrency: row.default_currency,
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

function mapLedgerEntry(row: LedgerEntryRow): LedgerEntryRecord {
  return {
    beancountText: row.beancount_text,
    createdAt: row.created_at,
    currency: row.currency,
    description: row.description,
    entryDate: row.entry_date,
    id: row.id,
    metadata: row.metadata ?? {},
    modelName: row.model_name,
    postings: row.postings,
    reversalOfEntryId: row.reversal_of_entry_id,
    reversedByEntryId: row.reversed_by_entry_id,
    sourcePrompt: row.source_prompt,
    status: row.status,
  };
}

export async function ensureStarterLedgersForUser(userId: string) {
  const supabase = createAdminClient();
  const { data: existingLedgers, error } = await supabase
    .from("ledgers")
    .select("id, name, slug, book_type, default_currency")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load ledgers: ${error.message}`);
  }

  if (existingLedgers.length > 0) {
    return existingLedgers.map(mapLedger);
  }

  const { data: createdLedgers, error: createLedgerError } = await supabase
    .from("ledgers")
    .insert(
      STARTER_LEDGER_TEMPLATES.map((ledger) => ({
        book_type: ledger.bookType,
        default_currency: "THB",
        name: ledger.name,
        owner_user_id: userId,
        slug: ledger.slug,
      })),
    )
    .select("id, name, slug, book_type, default_currency");

  if (createLedgerError || !createdLedgers) {
    throw new Error(
      `Failed to create starter ledgers: ${createLedgerError?.message ?? "Unknown error."}`,
    );
  }

  const accountsToInsert = createdLedgers.flatMap((ledger) => {
    const template = STARTER_LEDGER_TEMPLATES.find(
      (candidate) => candidate.slug === ledger.slug,
    );

    if (!template) {
      return [];
    }

    return template.accounts.map((account) => ({
      category: account.category,
      description: account.description ?? null,
      ledger_id: ledger.id,
      name: account.name,
    }));
  });

  const { error: createAccountsError } = await supabase
    .from("ledger_accounts")
    .insert(accountsToInsert);

  if (createAccountsError) {
    throw new Error(
      `Failed to create starter accounts: ${createAccountsError.message}`,
    );
  }

  return createdLedgers.map(mapLedger);
}

export async function getLedgerForUser(userId: string, ledgerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledgers")
    .select("id, name, slug, book_type, default_currency")
    .eq("owner_user_id", userId)
    .eq("id", ledgerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ledger: ${error.message}`);
  }

  return data ? mapLedger(data) : null;
}

export async function updateLedgerDefaultCurrency(params: {
  currency: string;
  ledgerId: string;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledgers")
    .update({
      default_currency: params.currency,
    })
    .eq("owner_user_id", params.userId)
    .eq("id", params.ledgerId)
    .select("id, name, slug, book_type, default_currency")
    .single();

  if (error) {
    throw new Error(`Failed to update ledger currency: ${error.message}`);
  }

  return mapLedger(data);
}

export async function getLedgerAccounts(ledgerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger_accounts")
    .select("id, name, category, description")
    .eq("ledger_id", ledgerId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load ledger accounts: ${error.message}`);
  }

  return data as LedgerAccount[];
}

const RECOMMENDED_ACCOUNTS: Record<
  LedgerSummary["bookType"],
  Array<{ category: LedgerAccount["category"]; description: string; name: string }>
> = {
  business: [
    {
      category: "asset",
      description: "Salary or wage advances to workers",
      name: "Assets:SalaryAdvance",
    },
    {
      category: "expense",
      description: "Contractor and handyman payments",
      name: "Expenses:Contractors",
    },
  ],
  personal: [
    {
      category: "asset",
      description: "Salary or wage advances to workers",
      name: "Assets:SalaryAdvance",
    },
    {
      category: "expense",
      description: "Home repairs, handyman, and maintenance",
      name: "Expenses:HomeMaintenance",
    },
    {
      category: "expense",
      description: "Maid, nanny, and other household staff wages",
      name: "Expenses:HouseholdStaff",
    },
  ],
};

export async function ensureRecommendedAccounts(
  ledgerId: string,
  bookType: LedgerSummary["bookType"],
) {
  const existingAccounts = await getLedgerAccounts(ledgerId);
  const existingNames = new Set(existingAccounts.map((account) => account.name));
  const missingAccounts = RECOMMENDED_ACCOUNTS[bookType].filter(
    (account) => !existingNames.has(account.name),
  );

  if (missingAccounts.length === 0) {
    return existingAccounts;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("ledger_accounts").insert(
    missingAccounts.map((account) => ({
      category: account.category,
      description: account.description,
      ledger_id: ledgerId,
      name: account.name,
    })),
  );

  if (error) {
    throw new Error(`Failed to ensure recommended accounts: ${error.message}`);
  }

  return getLedgerAccounts(ledgerId);
}

export async function createLedgerAccount(params: {
  category: LedgerAccount["category"];
  description?: string | null;
  ledgerId: string;
  name: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger_accounts")
    .insert({
      category: params.category,
      description: params.description ?? null,
      ledger_id: params.ledgerId,
      name: params.name,
    })
    .select("id, name, category, description")
    .single();

  if (error) {
    throw new Error(`Failed to create ledger account: ${error.message}`);
  }

  return data as LedgerAccount;
}

export async function updateLedgerAccount(params: {
  accountId: string;
  category: LedgerAccount["category"];
  description?: string | null;
  ledgerId: string;
  name: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger_accounts")
    .update({
      category: params.category,
      description: params.description ?? null,
      name: params.name,
    })
    .eq("id", params.accountId)
    .eq("ledger_id", params.ledgerId)
    .select("id, name, category, description")
    .single();

  if (error) {
    throw new Error(`Failed to update ledger account: ${error.message}`);
  }

  return data as LedgerAccount;
}

export async function deleteLedgerAccount(params: {
  accountId: string;
  ledgerId: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ledger_accounts")
    .delete()
    .eq("id", params.accountId)
    .eq("ledger_id", params.ledgerId);

  if (error) {
    throw new Error(`Failed to delete ledger account: ${error.message}`);
  }
}

async function insertLedgerEntry(params: {
  entry: StructuredLedgerEntry;
  ledgerId: string;
  reversalOfEntryId?: string | null;
  modelName: string;
  sourcePrompt: string;
  userId: string;
  beancountText: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .insert({
      beancount_text: params.beancountText,
      created_by_user_id: params.userId,
      currency: params.entry.currency,
      description: params.entry.description,
      entry_date: params.entry.entryDate,
      ledger_id: params.ledgerId,
      metadata: params.entry.metadata ?? {},
      model_name: params.modelName,
      postings: params.entry.postings,
      reversal_of_entry_id: params.reversalOfEntryId ?? null,
      source_prompt: params.sourcePrompt,
      status: "confirmed",
    })
    .select("id, created_at, reversal_of_entry_id")
    .single();

  if (error) {
    throw new Error(`Failed to create ledger entry: ${error.message}`);
  }

  const { error: postingsError } = await supabase
    .from("ledger_entry_postings")
    .insert(
      params.entry.postings.map((posting, index) => ({
        account_name: posting.account,
        amount: posting.amount,
        created_at: data.created_at,
        currency: params.entry.currency,
        ledger_entry_id: data.id,
        ledger_id: params.ledgerId,
        posting_index: index + 1,
      })),
    );

  if (postingsError) {
    await supabase.from("ledger_entries").delete().eq("id", data.id);
    throw new Error(`Failed to create posting rows: ${postingsError.message}`);
  }

  return data;
}

export async function createLedgerEntry(params: {
  entry: StructuredLedgerEntry;
  ledgerId: string;
  modelName: string;
  sourcePrompt: string;
  userId: string;
  beancountText: string;
}) {
  return insertLedgerEntry(params);
}

export async function getLedgerEntries(ledgerId: string, accountName?: string) {
  const supabase = createAdminClient();
  let entryIds: string[] | null = null;

  if (accountName) {
    const { data: postingRows, error: postingsError } = await supabase
      .from("ledger_entry_postings")
      .select("ledger_entry_id")
      .eq("ledger_id", ledgerId)
      .eq("account_name", accountName);

    if (postingsError) {
      throw new Error(`Failed to load posting rows: ${postingsError.message}`);
    }

    entryIds = Array.from(
      new Set(postingRows.map((posting) => posting.ledger_entry_id)),
    );

    if (entryIds.length === 0) {
      return [];
    }
  }

  const query = supabase
    .from("ledger_entries")
    .select(
      "id, entry_date, description, currency, postings, metadata, beancount_text, model_name, source_prompt, created_at, status, reversal_of_entry_id, reversed_by_entry_id",
    )
    .eq("ledger_id", ledgerId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  const { data, error } = entryIds ? await query.in("id", entryIds) : await query;

  if (error) {
    throw new Error(`Failed to load ledger entries: ${error.message}`);
  }

  return (data as LedgerEntryRow[]).map(mapLedgerEntry);
}

export async function getLedgerEntryById(entryId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(
      "id, ledger_id, entry_date, description, currency, postings, metadata, beancount_text, model_name, source_prompt, created_at, status, reversal_of_entry_id, reversed_by_entry_id, created_by_user_id",
    )
    .eq("id", entryId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ledger entry: ${error.message}`);
  }

  return data;
}

export async function updateLedgerEntryLabels(params: {
  entryId: string;
  labels: EntryLabelValues;
  userId: string;
}) {
  const originalEntry = await getLedgerEntryById(params.entryId);

  if (!originalEntry) {
    throw new Error("Ledger entry not found.");
  }

  const ledger = await getLedgerForUser(params.userId, originalEntry.ledger_id);

  if (!ledger) {
    throw new Error("Ledger not found.");
  }

  const structuredEntry = {
    currency: originalEntry.currency,
    description: originalEntry.description,
    entryDate: originalEntry.entry_date,
    metadata: (originalEntry.metadata ?? {}) as StructuredLedgerEntry["metadata"],
    postings: originalEntry.postings as StructuredLedgerEntry["postings"],
  };
  const updatedEntry = applyEntryLabels(structuredEntry, params.labels);
  const beancountText = buildBeancountEntry(updatedEntry);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .update({
      beancount_text: beancountText,
      description: updatedEntry.description,
      metadata: updatedEntry.metadata ?? {},
    })
    .eq("id", params.entryId)
    .eq("ledger_id", ledger.id)
    .select(
      "id, entry_date, description, currency, postings, metadata, beancount_text, model_name, source_prompt, created_at, status, reversal_of_entry_id, reversed_by_entry_id",
    )
    .single();

  if (error) {
    throw new Error(`Failed to update ledger entry labels: ${error.message}`);
  }

  return mapLedgerEntry(data as LedgerEntryRow);
}

export async function reverseLedgerEntry(params: {
  entryId: string;
  userId: string;
}) {
  const supabase = createAdminClient();
  const originalEntry = await getLedgerEntryById(params.entryId);

  if (!originalEntry) {
    throw new Error("Ledger entry not found.");
  }

  if (originalEntry.status === "reversed") {
    throw new Error("This entry has already been reversed.");
  }

  if (originalEntry.reversal_of_entry_id) {
    throw new Error("Reversal entries cannot be reversed again.");
  }

  const reversedEntry = await insertLedgerEntry({
    entry: {
      currency: originalEntry.currency,
      description: `Reversal of ${originalEntry.description}`,
      entryDate: new Date().toISOString().slice(0, 10),
      metadata: {
        ...((originalEntry.metadata as LedgerEntryRecord["metadata"]) ?? {}),
        notes: `Reversal of entry ${originalEntry.id}`,
      },
      postings: (originalEntry.postings as LedgerEntryRecord["postings"]).map(
        (posting) => ({
          account: posting.account,
          amount: posting.amount * -1,
        }),
      ),
    },
    beancountText: buildBeancountEntry({
      currency: originalEntry.currency,
      description: `Reversal of ${originalEntry.description}`,
      entryDate: new Date().toISOString().slice(0, 10),
      metadata: {
        ...((originalEntry.metadata as LedgerEntryRecord["metadata"]) ?? {}),
        notes: `Reversal of entry ${originalEntry.id}`,
      },
      postings: (originalEntry.postings as LedgerEntryRecord["postings"]).map(
        (posting) => ({
          account: posting.account,
          amount: posting.amount * -1,
        }),
      ),
    }),
    ledgerId: originalEntry.ledger_id,
    modelName: "manual-reversal",
    reversalOfEntryId: originalEntry.id,
    sourcePrompt: `Reversal of entry ${originalEntry.id}`,
    userId: params.userId,
  });

  const { error: updateError } = await supabase
    .from("ledger_entries")
    .update({
      reversed_by_entry_id: reversedEntry.id,
      status: "reversed",
    })
    .eq("id", originalEntry.id);

  if (updateError) {
    throw new Error(`Failed to mark entry as reversed: ${updateError.message}`);
  }

  return reversedEntry;
}
