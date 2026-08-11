import { NextResponse } from "next/server";

import { buildBeancountEntry, validateStructuredEntry } from "@/lib/ledger/preview";
import {
  createLedgerEntry,
  getLedgerAccounts,
  getLedgerForUser,
} from "@/lib/ledger/service";
import type { StructuredLedgerEntry } from "@/lib/ledger/types";
import { createClient } from "@/lib/supabase/server";

type ConfirmRequestBody = {
  entry?: StructuredLedgerEntry;
  ledgerId?: string;
  model?: string;
  sourcePrompt?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConfirmRequestBody;

    if (!body.ledgerId || !body.sourcePrompt || !body.entry) {
      return NextResponse.json(
        { error: "Missing ledgerId, sourcePrompt, or entry." },
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
    const validatedEntry = validateStructuredEntry(body.entry, accounts);
    const beancountText = buildBeancountEntry(validatedEntry);
    const createdEntry = await createLedgerEntry({
      beancountText,
      entry: validatedEntry,
      ledgerId: ledger.id,
      modelName: body.model ?? "unknown",
      sourcePrompt: body.sourcePrompt,
      userId: user.id,
    });

    return NextResponse.json({
      beancountText,
      createdEntry,
      ledger,
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm entry.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
