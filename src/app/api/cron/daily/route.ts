import { NextResponse } from "next/server";

import { runDailyJob } from "@/lib/cron/run-daily-job";
import { verifyCronRequest } from "@/lib/cron/verify-cron-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorizationError = verifyCronRequest(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const result = await runDailyJob();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Daily cron job failed.";

    return NextResponse.json({ error: message, ok: false }, { status: 500 });
  }
}
