import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Check if this is an implicit flow (access token in URL fragment)
  const url = new URL(request.url);
  const hash = url.hash;

  if (hash && hash.includes("access_token")) {
    // This is an implicit flow response - redirect to client-side handler
    console.log("Implicit flow detected, redirecting to client-side handler");
    return NextResponse.redirect(`${origin}/auth/implicit-callback`);
  }

  if (code) {
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
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
