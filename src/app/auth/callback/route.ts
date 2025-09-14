import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=${encodeURIComponent(
            error.message
          )}`
        );
      }

      if (data.user) {
        console.log("OAuth successful, user:", data.user.email);
        console.log("User metadata:", data.user.user_metadata);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(
          "Authentication failed"
        )}`
      );
    }
  }

  // No code provided
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=${encodeURIComponent(
      "No authorization code provided"
    )}`
  );
}
