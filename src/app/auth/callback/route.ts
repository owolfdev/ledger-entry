import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/configure-github";

  console.log("=== OAUTH CALLBACK DEBUG ===");
  console.log("OAuth callback - URL:", request.url);
  console.log(
    "OAuth callback - searchParams:",
    Object.fromEntries(searchParams.entries())
  );
  console.log("OAuth callback - code:", code);
  console.log("OAuth callback - next:", next);
  console.log("OAuth callback - origin:", origin);

  // Check if this is an error callback
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (error) {
    console.error("OAuth error received:", error);
    console.error("Error description:", errorDescription);
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (code) {
    const supabase = await createClient();

    try {
      console.log("Attempting to exchange code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth callback error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return NextResponse.redirect(
          `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
        );
      }

      console.log("Code exchange successful, data:", data);

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
