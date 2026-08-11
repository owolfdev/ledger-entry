import { STARTER_LEDGER_TEMPLATES } from "@/lib/ledger/starter-ledgers";
import type {
  LedgerAccount,
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

function mapLedger(row: LedgerRow): LedgerSummary {
  return {
    bookType: row.book_type,
    defaultCurrency: row.default_currency,
    id: row.id,
    name: row.name,
    slug: row.slug,
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

export async function getLedgerAccounts(ledgerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger_accounts")
    .select("name, category, description")
    .eq("ledger_id", ledgerId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load ledger accounts: ${error.message}`);
  }

  return data as LedgerAccount[];
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

  return data;
}
