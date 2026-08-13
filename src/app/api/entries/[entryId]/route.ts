import { NextResponse } from "next/server";

import type { EntryLabelValues } from "@/lib/ledger/entry-labels";
import { updateLedgerEntryLabels } from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

type UpdateEntryLabelsBody = {
  description?: string;
  notes?: string;
  paymentMethod?: string;
  reference?: string;
  vendorName?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  try {
    const { entryId } = await context.params;
    const body = (await request.json()) as UpdateEntryLabelsBody;

    if (typeof body.description !== "string") {
      return NextResponse.json({ error: "Missing entry title." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const labels: EntryLabelValues = {
      description: body.description,
      notes: body.notes ?? "",
      paymentMethod: body.paymentMethod ?? "",
      reference: body.reference ?? "",
      vendorName: body.vendorName ?? "",
    };

    const updatedEntry = await updateLedgerEntryLabels({
      entryId,
      labels,
      userId: user.id,
    });

    return NextResponse.json({ entry: updatedEntry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update entry labels.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
