"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RepoStatusCard } from "./repo-status-card";
import { CreateRepoForm } from "./create-repo-form";
import { RepoInfo } from "@/lib/ledger/repo-scanner";
import { Plus, RefreshCw, CheckCircle, ArrowLeft, Search } from "lucide-react";

interface RepoSelectionProps {
  onRepoConnected?: (repo: RepoInfo) => void;
}

type SelectionMode = "select" | "create" | "scanning";

export function RepoSelection({ onRepoConnected }: RepoSelectionProps) {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoInfo | null>(null);
  const [mode, setMode] = useState<SelectionMode>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualRepo, setManualRepo] = useState({ owner: "", name: "" });
  const [rateLimitReset, setRateLimitReset] = useState<Date | null>(null);

  const fetchRepos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Just get the repository list without scanning
      const response = await fetch("/api/github/repositories");
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes("rate limit")) {
          setError(
            "GitHub API rate limit exceeded. Please wait a few minutes or manually enter repository details below."
          );
          // Set rate limit reset time (approximately 1 hour from now)
          setRateLimitReset(new Date(Date.now() + 60 * 60 * 1000));
          return;
        }
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data.repos);
    } catch (err) {
      console.error("Error fetching repositories:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectRepo = async (repo: RepoInfo) => {
    try {
      setError(null);

      const response = await fetch("/api/ledger/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoOwner: repo.full_name.split("/")[0],
          repoName: repo.name,
          repoFullName: repo.full_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect repository");
      }

      // Notify parent component
      onRepoConnected?.(repo);
    } catch (err) {
      console.error("Error connecting repository:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      // Connection completed
    }
  };

  const handleCreateNewRepo = () => {
    setMode("create");
  };

  const handleRepoCreated = (repo: {
    id: number;
    name: string;
    full_name: string;
    description?: string;
    private: boolean;
    html_url: string;
    clone_url: string;
    default_branch: string;
    permissions: { admin: boolean; push: boolean; pull: boolean };
  }) => {
    // Convert the created repo to RepoInfo format
    const repoInfo: RepoInfo = {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description || null,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      permissions: repo.permissions,
      ledgerStructure: {
        hasMainJournal: true,
        hasAccountsJournal: true,
        hasEntriesFolder: true,
        hasRulesFolder: true,
        isCompatible: true,
        missingFiles: [],
        missingFolders: [],
      },
    };

    onRepoConnected?.(repoInfo);
  };

  const handleCancelCreate = () => {
    setMode("select");
  };

  const handleSelectRepo = async (repo: RepoInfo) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check compatibility for the selected repo only
      const response = await fetch("/api/github/check-compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: repo.full_name.split("/")[0],
          repo: repo.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check repository compatibility");
      }

      const data = await response.json();

      // Update the repo with the compatibility info
      const updatedRepo = {
        ...repo,
        ledgerStructure: data.ledgerStructure,
      };

      setSelectedRepo(updatedRepo);
      setMode("scanning");
    } catch (err) {
      console.error("Error checking repository compatibility:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setSelectedRepo(null);
    setMode("select");
  };

  const handleManualRepoSubmit = async () => {
    if (!manualRepo.owner || !manualRepo.name) {
      setError("Please enter both owner and repository name");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create a mock repo object for manual entry
      const mockRepo: RepoInfo = {
        id: 0, // Will be replaced when we can fetch real data
        name: manualRepo.name,
        full_name: `${manualRepo.owner}/${manualRepo.name}`,
        description: "Manually entered repository",
        private: false,
        html_url: `https://github.com/${manualRepo.owner}/${manualRepo.name}`,
        clone_url: `https://github.com/${manualRepo.owner}/${manualRepo.name}.git`,
        default_branch: "main",
        permissions: { admin: true, push: true, pull: true },
      };

      setSelectedRepo(mockRepo);
      setMode("scanning");
    } catch (err) {
      console.error("Error with manual repo:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRepos();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading repositories...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              {rateLimitReset && (
                <p className="text-sm text-muted-foreground">
                  Rate limit resets approximately at:{" "}
                  {rateLimitReset.toLocaleTimeString()}
                </p>
              )}
              <Button onClick={fetchRepos} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manual Repository Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Search className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              Manual Repository Entry
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter repository details manually when API is unavailable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Owner
                </label>
                <input
                  type="text"
                  placeholder="username or organization"
                  value={manualRepo.owner}
                  onChange={(e) =>
                    setManualRepo((prev) => ({
                      ...prev,
                      owner: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Repository Name
                </label>
                <input
                  type="text"
                  placeholder="repository-name"
                  value={manualRepo.name}
                  onChange={(e) =>
                    setManualRepo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
            </div>
            <Button
              onClick={handleManualRepoSubmit}
              disabled={isLoading || !manualRepo.owner || !manualRepo.name}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Check Repository
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Repository selection mode
  if (mode === "select") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            No Repository Connected
          </h2>
          <p className="text-muted-foreground">
            You need to select or create a repository for your ledger files
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Select Existing Repository */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Search className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                Select Existing Repository
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose from your existing GitHub repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {repos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No repositories found
                </p>
              ) : (
                <div className="space-y-2">
                  <Select
                    onValueChange={(value) => {
                      const repo = repos.find((r) => r.id.toString() === value);
                      if (repo) {
                        handleSelectRepo(repo);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a repository..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.id.toString()}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{repo.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {repo.full_name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Found {repos.length} repositories
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create New Repository */}
          <Card
            className="hover:shadow-md transition-all duration-200 cursor-pointer border-border hover:border-border/50"
            onClick={handleCreateNewRepo}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Plus className="h-5 w-5 text-green-500 dark:text-green-400" />
                Create New Repository
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Create a new repository with proper ledger structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A new repository will be created with all the required files and
                folders for your ledger.
              </p>
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  ⚠️ <strong>Rate Limit Active:</strong> GitHub API rate limit
                  is currently exceeded. You can still select an existing
                  repository from the dropdown above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Repository creation mode
  if (mode === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancelCreate}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Create New Repository
            </h2>
            <p className="text-sm text-muted-foreground">
              Set up a new repository with proper ledger structure
            </p>
          </div>
        </div>

        <CreateRepoForm
          onRepoCreated={handleRepoCreated}
          onCancel={handleCancelCreate}
        />
      </div>
    );
  }

  // Repository scanning/validation mode
  if (mode === "scanning" && selectedRepo) {
    const structure = selectedRepo.ledgerStructure;
    const isCompatible = structure?.isCompatible || false;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackToSelection}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Repository: {selectedRepo.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedRepo.full_name}
            </p>
          </div>
        </div>

        <RepoStatusCard
          repo={selectedRepo}
          onConnect={handleConnectRepo}
          onInitialize={handleConnectRepo} // Same as connect for now
        />

        {isCompatible ? (
          <Card className="border-border bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                <span className="font-medium">
                  This repository is compatible!
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You can connect this repository to start using it for your
                ledger files.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-foreground">
                <RefreshCw className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                <span className="font-medium">This repository needs setup</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                We can add the required files and folders to make this
                repository compatible with the ledger system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
