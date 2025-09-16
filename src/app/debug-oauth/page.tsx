"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBaseUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugOAuthPage() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthUrl, setOAuthUrl] = useState<string | null>(null);

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${info}`,
    ]);
  };

  const testOAuthFlow = async () => {
    setIsLoading(true);
    setDebugInfo([]);

    try {
      addDebugInfo("Starting OAuth flow test...");

      // Test environment variables
      addDebugInfo(`NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
      addDebugInfo(`NODE_ENV: ${process.env.NODE_ENV}`);
      addDebugInfo(`getBaseUrl(): ${getBaseUrl()}`);

      // Test Supabase client
      const supabase = createClient();
      addDebugInfo(`Supabase client created: ${!!supabase}`);
      addDebugInfo(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      addDebugInfo(
        `Supabase Key present: ${!!process.env
          .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}`
      );

      // Test current session
      const { data: session, error: sessionError } =
        await supabase.auth.getSession();
      addDebugInfo(`Current session: ${session?.session ? "Present" : "None"}`);
      if (sessionError) addDebugInfo(`Session error: ${sessionError.message}`);

      // Test OAuth initiation
      const redirectUrl = `${getBaseUrl()}/auth/callback?next=/configure-github`;
      addDebugInfo(`Redirect URL: ${redirectUrl}`);

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
        addDebugInfo(`OAuth error: ${error.message}`);
        addDebugInfo(`Error details: ${JSON.stringify(error, null, 2)}`);
      } else {
        addDebugInfo(`OAuth initiated successfully`);
        addDebugInfo(`OAuth URL: ${data?.url || "No URL returned"}`);

        if (data?.url) {
          addDebugInfo("OAuth URL generated successfully!");
          addDebugInfo("In debug mode, not redirecting automatically");
          addDebugInfo("You can manually visit the OAuth URL to test the flow");
          setOAuthUrl(data.url);
        }
      }
    } catch (err) {
      addDebugInfo(
        `Test failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
    setOAuthUrl(null);
  };

  const testOAuthUrl = () => {
    if (oauthUrl) {
      addDebugInfo("Opening OAuth URL in new tab...");
      window.open(oauthUrl, "_blank");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testOAuthFlow} disabled={isLoading}>
                {isLoading ? "Testing..." : "Test OAuth Flow"}
              </Button>
              {oauthUrl && (
                <Button onClick={testOAuthUrl} variant="default">
                  Test OAuth URL
                </Button>
              )}
              <Button onClick={clearDebugInfo} variant="outline">
                Clear Debug Info
              </Button>
            </div>

            {oauthUrl && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-md">
                <h3 className="font-semibold mb-2">Generated OAuth URL:</h3>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border text-xs break-all">
                  {oauthUrl}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You can copy this URL and test it manually, or use the "Test
                  OAuth URL" button.
                </p>
              </div>
            )}

            {debugInfo.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Debug Output:</h3>
                <div className="bg-muted/30 p-4 rounded-md max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {debugInfo.join("\n")}
                  </pre>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
              <h4 className="font-semibold mb-2">Configuration Checklist:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  ✅ GitHub OAuth app callback URL:{" "}
                  <code>
                    https://afhwkquktdnasvhyudez.supabase.co/auth/v1/callback
                  </code>
                </li>
                <li>
                  ✅ Supabase Site URL: <code>http://localhost:3000</code>
                </li>
                <li>
                  ✅ Supabase Redirect URLs include:{" "}
                  <code>http://localhost:3000/auth/callback</code>
                </li>
                <li>
                  ✅ GitHub OAuth app has <code>repo</code> and{" "}
                  <code>user:email</code> scopes
                </li>
                <li>
                  ✅ Supabase GitHub provider Client ID/Secret match GitHub
                  OAuth app
                </li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-md">
              <h4 className="font-semibold mb-2 text-red-800 dark:text-red-200">
                "Error getting user profile from external provider"
                Troubleshooting:
              </h4>
              <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
                <li>
                  🔍 <strong>Check GitHub OAuth App:</strong> Verify the Client
                  ID and Secret in Supabase match your GitHub OAuth app
                </li>
                <li>
                  🔍 <strong>Check Scopes:</strong> Ensure your GitHub OAuth app
                  has <code>repo</code> and <code>user:email</code> scopes
                </li>
                <li>
                  🔍 <strong>Check Callback URL:</strong> Must be exactly{" "}
                  <code>
                    https://afhwkquktdnasvhyudez.supabase.co/auth/v1/callback
                  </code>
                </li>
                <li>
                  🔍 <strong>Check GitHub App Status:</strong> Ensure your
                  GitHub OAuth app is active and not suspended
                </li>
                <li>
                  🔍 <strong>Check Supabase Provider:</strong> Verify GitHub
                  provider is enabled in Supabase Auth settings
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
