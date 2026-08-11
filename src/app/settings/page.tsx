import { redirect } from "next/navigation";

import { SettingsScreen } from "@/components/settings-screen";
import { ensureStarterLedgersForUser } from "@/lib/ledger/service";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  if (!hasSupabaseEnv()) {
    redirect("/login?next=/settings");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings");
  }

  const ledgers = await ensureStarterLedgersForUser(user.id);

  return <SettingsScreen ledgers={ledgers} />;
}
