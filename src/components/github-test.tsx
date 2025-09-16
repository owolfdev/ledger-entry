"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { getBaseUrl } from "@/lib/utils";

export function GitHubTest() {
  const [testResult, setTestResult] = useState<{
    status: "idle" | "testing" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const testGitHubOAuth = async () => {
    setTestResult({ status: "testing", message: "Testing GitHub OAuth..." });

    try {
      const supabase = createClient();

      // Try to initiate OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback?next=/configure-github`,
          scopes: "repo user:email",
        },
      });

      if (error) {
        setTestResult({
          status: "error",
          message: `OAuth Error: ${error.message}`,
        });
        return;
      }

      if (data?.url) {
        setTestResult({
          status: "success",
          message: "GitHub OAuth is configured! Redirecting to GitHub...",
        });

        // Actually redirect to GitHub
        window.location.href = data.url;
      } else {
        setTestResult({
          status: "error",
          message: "No redirect URL received from Supabase",
        });
      }
    } catch (error) {
      setTestResult({
        status: "error",
        message: `Test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  const getStatusIcon = () => {
    switch (testResult.status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Github className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (testResult.status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Working
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "testing":
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Ready to test</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          GitHub OAuth Test
        </CardTitle>
        <CardDescription>
          Test if GitHub OAuth is properly configured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {testResult.message && (
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm">{testResult.message}</p>
          </div>
        )}

        <Button
          onClick={testGitHubOAuth}
          disabled={testResult.status === "testing"}
          className="w-full"
        >
          <Github className="mr-2 h-4 w-4" />
          {testResult.status === "testing" ? "Testing..." : "Test GitHub OAuth"}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>This will:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Test if GitHub provider is enabled in Supabase</li>
            <li>Verify OAuth configuration</li>
            <li>Redirect you to GitHub for authentication</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
