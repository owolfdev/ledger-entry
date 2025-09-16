"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export function GitHubDebug() {
  const [userData, setUserData] = useState<{
    error?: string;
    email?: string;
    user_metadata?: {
      name?: string;
      user_name?: string;
      [key: string]: unknown;
    };
    app_metadata?: Record<string, unknown>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkUserData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error getting user:", error);
        setUserData({ error: error.message });
        return;
      }

      setUserData(user);
    } catch (error) {
      console.error("Error:", error);
      setUserData({ error: "Failed to get user data" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserData();
  }, []);

  const getTokenStatus = () => {
    if (!userData || userData.error) return "error";

    const hasToken =
      userData.user_metadata?.provider_token ||
      userData.user_metadata?.github_token ||
      userData.user_metadata?.access_token ||
      userData.app_metadata?.provider_token ||
      userData.app_metadata?.github_token;

    return hasToken ? "success" : "warning";
  };

  const getTokenStatusIcon = () => {
    const status = getTokenStatus();
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTokenStatusText = () => {
    const status = getTokenStatus();
    switch (status) {
      case "success":
        return "GitHub token found";
      case "warning":
        return "No GitHub token found";
      case "error":
        return "Error loading user data";
      default:
        return "Unknown status";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getTokenStatusIcon()}
          GitHub Authentication Debug
        </CardTitle>
        <CardDescription>
          Debug information for GitHub OAuth setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge
            variant={getTokenStatus() === "success" ? "default" : "secondary"}
            className={getTokenStatus() === "success" ? "bg-green-500" : ""}
          >
            {getTokenStatusText()}
          </Badge>
        </div>

        <Button
          onClick={checkUserData}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Refreshing..." : "Refresh User Data"}
        </Button>

        {userData && !userData.error && (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">User Information</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <strong>Email:</strong> {userData.email}
                </div>
                <div>
                  <strong>Name:</strong> {userData.user_metadata?.name || "N/A"}
                </div>
                <div>
                  <strong>GitHub Username:</strong>{" "}
                  {userData.user_metadata?.user_name || "N/A"}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">User Metadata Keys</h4>
              <div className="text-xs text-muted-foreground">
                {Object.keys(userData.user_metadata || {}).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(userData.user_metadata || {}).map((key) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span>No user metadata found</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">App Metadata Keys</h4>
              <div className="text-xs text-muted-foreground">
                {Object.keys(userData.app_metadata || {}).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(userData.app_metadata || {}).map((key) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span>No app metadata found</span>
                )}
              </div>
            </div>

            {getTokenStatus() === "warning" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-medium text-sm text-yellow-800 mb-2">
                  GitHub Token Missing
                </h5>
                <p className="text-xs text-yellow-700 mb-2">
                  The GitHub access token is not being stored. This usually
                  means:
                </p>
                <ul className="text-xs text-yellow-700 space-y-1 ml-4">
                  <li>
                    • GitHub OAuth app is not configured with correct scopes
                  </li>
                  <li>• Supabase GitHub provider is not properly configured</li>
                  <li>• User needs to re-authenticate with GitHub</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {userData?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h5 className="font-medium text-sm text-red-800 mb-2">
              Error Loading User Data
            </h5>
            <p className="text-xs text-red-700">{userData.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
