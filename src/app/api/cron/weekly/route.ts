import { NextResponse } from "next/server";

import { runWeeklyJob } from "@/lib/cron/run-weekly-job";
import { verifyCronRequest } from "@/lib/cron/verify-cron-request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorizationError = verifyCronRequest(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const result = await runWeeklyJob();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Weekly cron job failed.";

    return NextResponse.json({ error: message, ok: false }, { status: 500 });
  }
}
