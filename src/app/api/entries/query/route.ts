import { NextResponse } from "next/server";

import { buildJournalQueryFilters } from "@/lib/ledger/query";
import { getLedgerAccounts, getLedgerForUser } from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

type QueryRequestBody = {
  ledgerId?: string;
  prompt?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QueryRequestBody;
    const prompt = body.prompt?.trim();

    if (!body.ledgerId || !prompt) {
      return NextResponse.json(
        { error: "Missing ledgerId or prompt." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const ledger = await getLedgerForUser(user.id, body.ledgerId);

    if (!ledger) {
      return NextResponse.json({ error: "Ledger not found." }, { status: 404 });
    }

    const accounts = await getLedgerAccounts(ledger.id);
    const query = await buildJournalQueryFilters({
      accounts,
      ledger,
      prompt,
    });

    return NextResponse.json(query);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to interpret query.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
