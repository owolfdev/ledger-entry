"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function ImplicitCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleImplicitCallback = async () => {
      // Get the hash from the URL
      const hash = window.location.hash;

      if (hash && hash.includes("access_token")) {
        console.log("Implicit flow detected, processing token...");

        // Parse the hash parameters
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const expiresAt = params.get("expires_at");
        const refreshToken = params.get("refresh_token");
        const tokenType = params.get("token_type");

        if (accessToken) {
          // Create Supabase client
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
          );

          try {
            // Set the session manually
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (error) {
              console.error("Error setting session:", error);
              router.push(
                "/auth/auth-code-error?error=" +
                  encodeURIComponent(error.message)
              );
              return;
            }

            if (data.user) {
              console.log("Implicit flow successful, user:", data.user.email);
              router.push("/");
              return;
            }
          } catch (error) {
            console.error("Error processing implicit callback:", error);
            router.push(
              "/auth/auth-code-error?error=" +
                encodeURIComponent("Authentication failed")
            );
            return;
          }
        }
      }

      // If no access token, redirect to error
      router.push(
        "/auth/auth-code-error?error=" +
          encodeURIComponent("No access token provided")
      );
    };

    handleImplicitCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          Processing Authentication...
        </h1>
        <p className="text-gray-600">
          Please wait while we complete your sign-in.
        </p>
      </div>
    </div>
  );
}
