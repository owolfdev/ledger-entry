"use client";

import { GitHubRepository } from "@/lib/github/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, Unlock, GitBranch, BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface RepositoryListProps {
  repositories: GitHubRepository[];
}

export function RepositoryList({ repositories }: RepositoryListProps) {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(
    null
  );

  const canWrite = (repo: GitHubRepository) => {
    return repo.permissions.push || repo.permissions.admin;
  };

  const canRead = (repo: GitHubRepository) => {
    return (
      repo.permissions.pull || repo.permissions.push || repo.permissions.admin
    );
  };

  const getPermissionLevel = (repo: GitHubRepository) => {
    if (repo.permissions.admin) return "Admin";
    if (repo.permissions.push) return "Write";
    if (repo.permissions.pull) return "Read";
    return "No Access";
  };

  const getPermissionColor = (repo: GitHubRepository) => {
    if (repo.permissions.admin) return "bg-red-500";
    if (repo.permissions.push) return "bg-green-500";
    if (repo.permissions.pull) return "bg-blue-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo) => (
          <Card
            key={repo.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRepo?.id === repo.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRepo(repo)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{repo.name}</CardTitle>
                  {repo.private ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Badge
                  variant="default"
                  className={`text-xs text-white ${getPermissionColor(repo)}`}
                >
                  {getPermissionLevel(repo)}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {repo.description || "No description available"}
              </CardDescription>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span>{repo.default_branch}</span>
                <span>•</span>
                <span>{repo.private ? "Private" : "Public"}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {repo.full_name}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  {canRead(repo) && (
                    <Button
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/repositories/${repo.full_name}`}>
                        Browse Files
                      </Link>
                    </Button>
                  )}
                  {canWrite(repo) && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/ledger-setup?repo=${encodeURIComponent(
                          repo.full_name
                        )}`}
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Setup Ledger
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRepo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Repository Details</CardTitle>
            <CardDescription>{selectedRepo.full_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Permissions</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedRepo.permissions.admin ? "default" : "secondary"
                      }
                    >
                      Admin
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedRepo.permissions.admin ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedRepo.permissions.push ? "default" : "secondary"
                      }
                    >
                      Push
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedRepo.permissions.push ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedRepo.permissions.pull ? "default" : "secondary"
                      }
                    >
                      Pull
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedRepo.permissions.pull ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  {canRead(selectedRepo) && (
                    <Button asChild className="w-full">
                      <Link href={`/repositories/${selectedRepo.full_name}`}>
                        Browse Files
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={selectedRepo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on GitHub
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
