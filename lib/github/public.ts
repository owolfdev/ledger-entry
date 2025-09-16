import { GitHubRepository } from "./client";

interface GitHubApiRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  permissions?: {
    admin?: boolean;
    push?: boolean;
    pull?: boolean;
  };
}

interface GitHubApiFile {
  name: string;
  path: string;
  type: string;
  size: number;
  download_url: string | null;
  sha?: string;
}

export async function getPublicRepositories(
  username: string
): Promise<GitHubRepository[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((repo: GitHubApiRepository) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      permissions: {
        admin: repo.permissions?.admin || false,
        push: repo.permissions?.push || false,
        pull: repo.permissions?.pull || true, // Public repos are readable
      },
    }));
  } catch (error) {
    console.error("Error fetching public repositories:", error);
    return [];
  }
}

export async function getPublicRepositoryContents(
  owner: string,
  repo: string,
  path: string = "",
  branch: string = "main"
) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((item: GitHubApiFile) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        download_url: item.download_url,
        sha: item.sha,
      }));
    } else {
      return [
        {
          name: data.name,
          path: data.path,
          type: data.type,
          size: data.size,
          download_url: data.download_url,
          sha: data.sha,
        },
      ];
    }
  } catch (error) {
    console.error("Error fetching repository contents:", error);
    return [];
  }
}

export async function getPublicFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = "main"
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    if ("content" in data && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    throw new Error("File content not found");
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw new Error("Failed to fetch file content");
  }
}
