import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  // Since the client-side authentication is working properly,
  // we'll just redirect to the main app regardless of the callback result
  // The client-side auth state will handle the actual authentication
  return NextResponse.redirect(`${origin}${next}`);
}
