import { NextResponse } from "next/server";

import { getLedgerEntries, getLedgerForUser } from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountName = searchParams.get("accountName")?.trim();
    const ledgerId = searchParams.get("ledgerId");

    if (!ledgerId) {
      return NextResponse.json({ error: "Missing ledgerId." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const ledger = await getLedgerForUser(user.id, ledgerId);

    if (!ledger) {
      return NextResponse.json({ error: "Ledger not found." }, { status: 404 });
    }

    const entries = await getLedgerEntries(ledger.id, accountName || undefined);

    return NextResponse.json({ entries });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load entries.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
