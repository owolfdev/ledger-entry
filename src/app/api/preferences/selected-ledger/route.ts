import { NextResponse } from "next/server";

import {
  SELECTED_LEDGER_COOKIE_NAME,
} from "@/lib/ledger/selected-ledger";
import { getLedgerForUser } from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

type SelectedLedgerBody = {
  ledgerId?: string;
};

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as SelectedLedgerBody;

    if (!body.ledgerId) {
      return NextResponse.json({ error: "Missing ledgerId." }, { status: 400 });
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

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SELECTED_LEDGER_COOKIE_NAME, ledger.id, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to persist selected ledger.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
