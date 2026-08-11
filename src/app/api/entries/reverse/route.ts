import { NextResponse } from "next/server";

import { getLedgerForUser, getLedgerEntryById, reverseLedgerEntry } from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { entryId?: string };

  try {
    body = (await request.json()) as { entryId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.entryId) {
    return NextResponse.json({ error: "Entry ID is required." }, { status: 400 });
  }

  const entry = await getLedgerEntryById(body.entryId);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const ledger = await getLedgerForUser(user.id, entry.ledger_id);

  if (!ledger) {
    return NextResponse.json({ error: "Ledger not found." }, { status: 404 });
  }

  try {
    const reversalEntry = await reverseLedgerEntry({
      entryId: body.entryId,
      userId: user.id,
    });

    return NextResponse.json({ reversalEntry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reverse ledger entry.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
