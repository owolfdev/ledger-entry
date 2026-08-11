import { NextResponse } from "next/server";

import { getLedgerForUser, updateLedgerDefaultCurrency } from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

type LedgerPatchBody = {
  defaultCurrency?: string;
  ledgerId?: string;
};

const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as LedgerPatchBody;
    const currency = body.defaultCurrency?.trim().toUpperCase();

    if (!body.ledgerId || !currency) {
      return NextResponse.json(
        { error: "Missing ledgerId or defaultCurrency." },
        { status: 400 },
      );
    }

    if (!CURRENCY_CODE_REGEX.test(currency)) {
      return NextResponse.json(
        { error: "Currency must be a 3-letter code like THB or USD." },
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

    const updatedLedger = await updateLedgerDefaultCurrency({
      currency,
      ledgerId: ledger.id,
      userId: user.id,
    });

    return NextResponse.json({ ledger: updatedLedger });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update ledger.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
