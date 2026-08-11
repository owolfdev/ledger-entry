import { redirect } from "next/navigation";

import { AppHomeScreen } from "@/components/app-home-screen";
import {
  getSelectedLedgerIdFromCookie,
  prioritizeSelectedLedger,
} from "@/lib/ledger/selected-ledger";
import { ensureStarterLedgersForUser } from "@/lib/ledger/service";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (!hasSupabaseEnv()) {
    redirect("/login?next=/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/");
  }

  const selectedLedgerId = await getSelectedLedgerIdFromCookie();
  const ledgers = prioritizeSelectedLedger(
    await ensureStarterLedgersForUser(user.id),
    selectedLedgerId,
  );

  return <AppHomeScreen ledgers={ledgers} />;
}
