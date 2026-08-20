import { NextResponse } from "next/server";

import {
  generateLedgerPreviewFromImage,
  validateReceiptImage,
} from "@/lib/ledger/preview-from-image";
import {
  ensureRecommendedAccounts,
  getLedgerForUser,
} from "@/lib/ledger/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const ledgerId = formData.get("ledgerId");
    const image = formData.get("image");

    if (typeof ledgerId !== "string" || !ledgerId.trim()) {
      return NextResponse.json({ error: "Missing ledgerId." }, { status: 400 });
    }

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Missing receipt image." }, { status: 400 });
    }

    validateReceiptImage(image);

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

    const accounts = await ensureRecommendedAccounts(ledger.id, ledger.bookType);
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const previews = await generateLedgerPreviewFromImage({
      accounts,
      imageBase64: imageBuffer.toString("base64"),
      imageMimeType: image.type,
      ledger,
    });

    return NextResponse.json({ previews });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate receipt preview.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
