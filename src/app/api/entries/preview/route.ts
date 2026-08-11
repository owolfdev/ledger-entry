import { NextResponse } from "next/server";

import { generateLedgerPreview } from "@/lib/ledger/preview";
import { getLedgerAccounts, getLedgerForUser } from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

type PreviewRequestBody = {
  ledgerId?: string;
  prompt?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreviewRequestBody;
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
    const preview = await generateLedgerPreview({
      accounts,
      ledger,
      prompt,
    });

    return NextResponse.json({ preview });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate preview.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
