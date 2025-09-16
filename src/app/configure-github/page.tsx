"use client";

import { useState, useEffect } from "react";
import { RepoSelection } from "@/components/ledger/repo-selection";
import { RepoInfo } from "@/lib/ledger/repo-scanner";
import { ConnectedRepo } from "@/lib/ledger/repo-db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, ArrowRight, RefreshCw } from "lucide-react";

export default function ConfigureGitHubPage() {
  const [connectedRepo, setConnectedRepo] = useState<ConnectedRepo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const checkConnectedRepo = async () => {
    try {
      // Just check if there's a connected repo, don't scan all repos
      const response = await fetch("/api/ledger/repos");
      if (response.ok) {
        const data = await response.json();
        setConnectedRepo(data.connectedRepo);
      }
    } catch (error) {
      console.error("Error checking connected repo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnectedRepo();
  }, []);

  const handleRepoConnected = (repo: RepoInfo) => {
    // Convert RepoInfo to ConnectedRepo format
    const connectedRepo: ConnectedRepo = {
      id: repo.id.toString(),
      user_id: "", // Will be set by the API
      repo_owner: repo.full_name.split("/")[0],
      repo_name: repo.name,
      repo_full_name: repo.full_name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setConnectedRepo(connectedRepo);
  };

  const handleSwitchRepository = () => {
    setConnectedRepo(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Configure GitHub
          </h1>
          <p className="text-muted-foreground">
            Set up a compatible repository for your ledger files
          </p>
        </div>

        {connectedRepo ? (
          <div className="space-y-6">
            {/* Success State */}
            <Card className="border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                  Repository Connected Successfully
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your ledger repository is ready to use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {connectedRepo.repo_name || "Repository Name"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {connectedRepo.repo_full_name || "Repository Full Name"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                      <span className="text-sm text-muted-foreground">
                        Ready
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      Continue to Ledger
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                    <button
                      onClick={handleSwitchRepository}
                      className="inline-flex items-center px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
                    >
                      Switch Repository
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <RepoSelection onRepoConnected={handleRepoConnected} />
        )}
      </div>
    </div>
  );
}
