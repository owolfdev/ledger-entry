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

    const redirectUrl = `${getBaseUrl()}/auth/callback?next=/repositories`;

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

      if (error) {
        console.error("GitHub auth error:", error);
        alert(`GitHub authentication failed: ${error.message}`);
        return;
      }

      console.log("GitHub auth initiated:", data);
    } catch (error) {
      console.error("GitHub auth error:", error);
      alert("GitHub authentication failed. Please check your configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}
