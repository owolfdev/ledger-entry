import { redirect } from "next/navigation";

import { AccountsSettingsScreen } from "@/components/accounts-settings-screen";
import {
  getSelectedLedgerIdFromCookie,
  prioritizeSelectedLedger,
} from "@/lib/ledger/selected-ledger";
import { ensureStarterLedgersForUser, getLedgerAccounts } from "@/lib/ledger/service";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function AccountsSettingsPage() {
  if (!hasSupabaseEnv()) {
    redirect("/login?next=/settings/accounts");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings/accounts");
  }

  const selectedLedgerId = await getSelectedLedgerIdFromCookie();
  const ledgers = prioritizeSelectedLedger(
    await ensureStarterLedgersForUser(user.id),
    selectedLedgerId,
  );
  const initialAccounts = ledgers[0]
    ? await getLedgerAccounts(ledgers[0].id)
    : [];

  return (
    <AccountsSettingsScreen
      ledgers={ledgers}
      initialAccounts={initialAccounts}
    />
  );
}
