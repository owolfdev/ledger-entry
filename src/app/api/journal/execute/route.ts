import { NextResponse } from "next/server";

import { executeJournalCommand } from "@/lib/ledger/commands/execute";
import {
  getLedgerAccounts,
  getLedgerEntries,
  getLedgerForUser,
} from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

type ExecuteRequestBody = {
  input?: string;
  ledgerId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExecuteRequestBody;
    const input = body.input?.trim();

    if (!body.ledgerId || !input) {
      return NextResponse.json(
        { error: "Missing ledgerId or input." },
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

    const [accounts, entries] = await Promise.all([
      getLedgerAccounts(ledger.id),
      getLedgerEntries(ledger.id),
    ]);

    const result = await executeJournalCommand({
      accounts,
      entries,
      input,
      ledger,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to execute journal command.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
