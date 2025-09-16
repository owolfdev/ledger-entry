import { getGitHubClient } from "@/lib/github/server";
import { getPublicRepositoryContents } from "@/lib/github/public";
import { FileBrowser } from "@/components/file-browser";
import { notFound } from "next/navigation";

interface RepositoryPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
  searchParams: Promise<{
    path?: string;
    branch?: string;
  }>;
}

export default async function RepositoryPage({
  params,
  searchParams,
}: RepositoryPageProps) {
  const { owner, repo } = await params;
  const { path = "", branch = "main" } = await searchParams;

  let files = [];

  try {
    // Try to get files with GitHub token first
    const githubClient = await getGitHubClient();

    if (githubClient) {
      files = await githubClient.getRepositoryContents(
        owner,
        repo,
        path,
        branch
      );
    } else {
      // Fallback to public API
      console.log("Using public GitHub API for repository contents");
      files = await getPublicRepositoryContents(owner, repo, path, branch);
    }

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {owner}/{repo}
            </h1>
            <p className="text-muted-foreground">
              Browse and manage files in this repository
            </p>
          </div>

          <FileBrowser
            owner={owner}
            repo={repo}
            files={files}
            currentPath={path}
            currentBranch={branch}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading repository:", error);
    notFound();
  }
}
