"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { useState } from "react";
import { getBaseUrl } from "@/lib/utils";

interface GitHubAuthButtonProps {
  mode?: "signin" | "signup";
  className?: string;
}

export function GitHubAuthButton({
  mode = "signin",
  className,
}: GitHubAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubAuth = async () => {
    const supabase = createClient();
    setIsLoading(true);

    const redirectUrl = `${getBaseUrl()}/auth/callback?next=/configure-github`;
    console.log("=== GITHUB AUTH DEBUG ===");
    console.log("GitHub auth - redirectUrl:", redirectUrl);
    console.log("GitHub auth - getBaseUrl():", getBaseUrl());
    console.log(
      "Current URL:",
      typeof window !== "undefined" ? window.location.href : "undefined"
    );
    console.log("Environment variables:");
    console.log("- NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
    console.log("- NODE_ENV:", process.env.NODE_ENV);

    try {
      console.log("Initiating OAuth with Supabase...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          scopes: "repo user:email",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("GitHub auth error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        alert(`GitHub authentication failed: ${error.message}`);
        return;
      }

      console.log("GitHub auth initiated successfully:", data);
      console.log("OAuth URL:", data?.url);

      if (data?.url) {
        console.log("Redirecting to GitHub OAuth...");
        // The redirect should happen automatically, but let's log it
      } else {
        console.warn("No OAuth URL returned from Supabase");
      }
    } catch (error) {
      console.error("GitHub auth error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      alert("GitHub authentication failed. Please check your configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className={`w-full ${className}`}
        onClick={handleGitHubAuth}
        disabled={isLoading}
      >
        <Github className="mr-2 h-4 w-4" />
        {isLoading
          ? "Connecting..."
          : mode === "signin"
          ? "Continue with GitHub"
          : "Sign up with GitHub"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          console.log("Debug info:");
          console.log("getBaseUrl():", getBaseUrl());
          console.log(
            "window.location.origin:",
            typeof window !== "undefined" ? window.location.origin : "undefined"
          );
          console.log(
            "NEXT_PUBLIC_SITE_URL:",
            process.env.NEXT_PUBLIC_SITE_URL
          );

          // Test Supabase client
          const supabase = createClient();
          console.log("Supabase client created:", !!supabase);
          console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
          console.log(
            "Supabase Key:",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
              ? "Present"
              : "Missing"
          );

          // Test OAuth URL generation
          const redirectUrl = `${getBaseUrl()}/auth/callback?next=/configure-github`;
          console.log("Generated redirect URL:", redirectUrl);

          // Test if we can get current session
          try {
            const { data: session, error: sessionError } =
              await supabase.auth.getSession();
            console.log("Current session:", session);
            console.log("Session error:", sessionError);
          } catch (err) {
            console.error("Session check failed:", err);
          }

          // Test if we can initiate OAuth (without actually doing it)
          try {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: "github",
              options: {
                redirectTo: redirectUrl,
                scopes: "repo user:email",
                queryParams: {
                  access_type: "offline",
                  prompt: "consent",
                },
              },
            });
            console.log("OAuth initiation test - data:", data);
            console.log("OAuth initiation test - error:", error);

            if (error) {
              console.error("OAuth configuration issue detected:");
              console.error("- Check GitHub OAuth app configuration");
              console.error("- Check Supabase GitHub provider settings");
              console.error(
                "- Verify callback URL matches: https://afhwkquktdnasvhyudez.supabase.co/auth/v1/callback"
              );
            }
          } catch (err) {
            console.error("OAuth initiation test failed:", err);
          }
        }}
        className="w-full text-xs"
      >
        🧪 Debug OAuth URL
      </Button>
    </div>
  );
}
