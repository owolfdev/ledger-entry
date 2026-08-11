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
    sourcePrompt: row.source_prompt,
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

export async function createLedgerEntry(params: {
  entry: StructuredLedgerEntry;
  ledgerId: string;
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
      source_prompt: params.sourcePrompt,
    })
    .select("id, created_at")
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
      "id, entry_date, description, currency, postings, metadata, beancount_text, model_name, source_prompt, created_at",
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
