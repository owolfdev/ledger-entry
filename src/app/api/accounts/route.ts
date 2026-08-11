import { NextResponse } from "next/server";

import {
  createLedgerAccount,
  deleteLedgerAccount,
  getLedgerAccounts,
  getLedgerForUser,
  updateLedgerAccount,
} from "@/lib/ledger/service";
import type { LedgerAccount } from "@/lib/ledger/types";
import { createClient } from "@/lib/supabase/server";

type AccountBody = {
  accountId?: string;
  category?: LedgerAccount["category"];
  description?: string | null;
  ledgerId?: string;
  name?: string;
};

async function getAuthorizedLedger(ledgerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized.", ledger: null, status: 401 as const };
  }

  const ledger = await getLedgerForUser(user.id, ledgerId);

  if (!ledger) {
    return { error: "Ledger not found.", ledger: null, status: 404 as const };
  }

  return { error: null, ledger, status: 200 as const };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ledgerId = searchParams.get("ledgerId");

    if (!ledgerId) {
      return NextResponse.json({ error: "Missing ledgerId." }, { status: 400 });
    }

    const authResult = await getAuthorizedLedger(ledgerId);

    if (!authResult.ledger) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const accounts = await getLedgerAccounts(authResult.ledger.id);

    return NextResponse.json({ accounts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load accounts.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AccountBody;

    if (!body.ledgerId || !body.name || !body.category) {
      return NextResponse.json(
        { error: "Missing ledgerId, name, or category." },
        { status: 400 },
      );
    }

    const authResult = await getAuthorizedLedger(body.ledgerId);

    if (!authResult.ledger) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const account = await createLedgerAccount({
      category: body.category,
      description: body.description,
      ledgerId: authResult.ledger.id,
      name: body.name.trim(),
    });

    return NextResponse.json({ account });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as AccountBody;

    if (!body.accountId || !body.ledgerId || !body.name || !body.category) {
      return NextResponse.json(
        { error: "Missing accountId, ledgerId, name, or category." },
        { status: 400 },
      );
    }

    const authResult = await getAuthorizedLedger(body.ledgerId);

    if (!authResult.ledger) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const account = await updateLedgerAccount({
      accountId: body.accountId,
      category: body.category,
      description: body.description,
      ledgerId: authResult.ledger.id,
      name: body.name.trim(),
    });

    return NextResponse.json({ account });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as AccountBody;

    if (!body.accountId || !body.ledgerId) {
      return NextResponse.json(
        { error: "Missing accountId or ledgerId." },
        { status: 400 },
      );
    }

    const authResult = await getAuthorizedLedger(body.ledgerId);

    if (!authResult.ledger) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    await deleteLedgerAccount({
      accountId: body.accountId,
      ledgerId: authResult.ledger.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
