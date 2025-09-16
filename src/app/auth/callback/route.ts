import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/configure-github";

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(
          `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
        );
      }

      if (data.user) {
        console.log("OAuth successful, user:", data.user.email);
        console.log("User metadata:", data.user.user_metadata);

        // Check if we have GitHub token
        const githubToken =
          data.user.user_metadata?.provider_token ||
          data.user.user_metadata?.github_token ||
          data.user.user_metadata?.access_token;

        if (githubToken) {
          console.log("GitHub token found in OAuth callback");
        } else {
          console.log("No GitHub token found in OAuth callback");
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(
          "Authentication failed"
        )}`
      );
    }
  }

  // No code provided
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent(
      "No authorization code provided"
    )}`
  );
}
