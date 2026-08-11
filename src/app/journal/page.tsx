import { redirect } from "next/navigation";

import { JournalScreen } from "@/components/journal-screen";
import {
  getSelectedLedgerIdFromCookie,
  prioritizeSelectedLedger,
} from "@/lib/ledger/selected-ledger";
import {
  ensureStarterLedgersForUser,
  getLedgerAccounts,
  getLedgerEntries,
} from "@/lib/ledger/service";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function JournalPage() {
  if (!hasSupabaseEnv()) {
    redirect("/login?next=/journal");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/journal");
  }

  const selectedLedgerId = await getSelectedLedgerIdFromCookie();
  const ledgers = prioritizeSelectedLedger(
    await ensureStarterLedgersForUser(user.id),
    selectedLedgerId,
  );
  const initialEntries = ledgers[0] ? await getLedgerEntries(ledgers[0].id) : [];
  const initialAccounts = ledgers[0] ? await getLedgerAccounts(ledgers[0].id) : [];

  return (
    <JournalScreen
      ledgers={ledgers}
      initialEntries={initialEntries}
      initialAccounts={initialAccounts}
    />
  );
}
