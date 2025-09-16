"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LedgerSetupWizard } from "@/components/ledger-setup/ledger-setup-wizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export default function LedgerSetupPage() {
  const searchParams = useSearchParams();
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [preselectedRepo, setPreselectedRepo] = useState<string | null>(null);

  const fetchRepositories = async () => {
    try {
      const response = await fetch("/api/github/repositories");
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();

    // Check if a repository was preselected from URL
    const repoParam = searchParams.get("repo");
    if (repoParam) {
      setPreselectedRepo(repoParam);
      setShowWizard(true);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">
                Loading repositories...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="container mx-auto py-8 px-4">
        <LedgerSetupWizard
          repositories={repositories}
          preselectedRepo={preselectedRepo}
          onComplete={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Setup Ledger</h1>
          <p className="text-muted-foreground">
            Create a new ledger in one of your GitHub repositories
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>What is a Ledger?</CardTitle>
              <CardDescription>
                A plain-text accounting system for tracking your finances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Plain text files stored in your GitHub repo</li>
                  <li>• Multi-currency support</li>
                  <li>• Natural language transaction entry</li>
                  <li>• Automatic categorization rules</li>
                  <li>• Git version control for all changes</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Templates Available:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Thailand (THB) - Thai banks and merchants</li>
                  <li>• United States (USD) - US banks and merchants</li>
                  <li>• Basic - Minimal setup for testing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>What you need to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">GitHub Setup:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• A GitHub repository with write access</li>
                  <li>• Personal Access Token with 'repo' scope</li>
                  <li>• GitHub account connected to this app</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">What Gets Created:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• main.journal - Main ledger file</li>
                  <li>• accounts.journal - Chart of accounts</li>
                  <li>• entries/ - Monthly transaction files</li>
                  <li>• rules/ - Categorization rules</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setShowWizard(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md font-medium transition-colors"
          >
            Start Setup Wizard
          </button>
        </div>
      </div>
    </div>
  );
}
