"use client";

import { useState, useEffect } from "react";
import { RepositoryList } from "@/components/repository-list";
import { GitHubDebug } from "@/components/github-debug";
import { CreateRepositoryForm } from "@/components/create-repository-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const handleRepositoryCreated = (newRepository: GitHubRepository) => {
    setRepositories((prev) => [newRepository, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading repositories...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your GitHub Repositories</h1>
          <p className="text-muted-foreground">
            Select a repository to browse and manage its files
          </p>
        </div>

        {repositories.length === 0 ? (
          <div className="space-y-6">
            <GitHubDebug />
            <CreateRepositoryForm
              onRepositoryCreated={handleRepositoryCreated}
            />
            <Card>
              <CardHeader>
                <CardTitle>No Repositories Found</CardTitle>
                <CardDescription>
                  You don&apos;t have access to any repositories or GitHub
                  authentication is not set up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Make sure you&apos;ve authenticated with GitHub and have
                  access to repositories.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <CreateRepositoryForm
              onRepositoryCreated={handleRepositoryCreated}
            />
            <RepositoryList repositories={repositories} />
          </div>
        )}
      </div>
    </div>
  );
}
