"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";

export function GitHubTokenInput() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/github/store-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(
          "GitHub token stored successfully! Refresh the page to see private repositories."
        );
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to store token");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to store token");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          GitHub Token Setup
        </CardTitle>
        <CardDescription>
          To access private repositories, you need to provide a GitHub access
          token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">GitHub Personal Access Token</Label>
          <Input
            id="token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Create a token at{" "}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              GitHub Settings
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            with repo scope
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Button type="submit" disabled={isLoading || !token}>
            {isLoading ? "Storing..." : "Store Token"}
          </Button>
        </form>

        {status === "success" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700">{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{message}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Required scopes:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>repo (Full control of private repositories)</li>
            <li>user:email (Access to user email addresses)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
