import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Check if this is an implicit flow (access token in URL fragment)
  const url = new URL(request.url);
  const hash = url.hash;

  if (hash && hash.includes("access_token")) {
    // This is an implicit flow response - redirect to main app
    // The client-side auth will handle the token
    console.log("Implicit flow detected, redirecting to main app");
    return NextResponse.redirect(`${origin}${next}`);
  }

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
