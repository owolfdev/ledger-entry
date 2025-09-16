import { Octokit } from "@octokit/rest";

export interface GitHubRepository {
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

export interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  download_url: string | null;
  content?: string;
  sha?: string;
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async getUserRepositories(): Promise<GitHubRepository[]> {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100,
      });

      return data.map((repo) => ({
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
          pull: repo.permissions?.pull || false,
        },
      }));
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw new Error("Failed to fetch repositories");
    }
  }

  async getRepositoryContents(
    owner: string,
    repo: string,
    path: string = "",
    branch: string = "main"
  ): Promise<GitHubFile[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data)) {
        return data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type as "file" | "dir",
          size: item.size,
          download_url: item.download_url,
          sha: item.sha,
        }));
      } else {
        return [
          {
            name: data.name,
            path: data.path,
            type: data.type as "file" | "dir",
            size: data.size,
            download_url: data.download_url,
            sha: data.sha,
          },
        ];
      }
    } catch (error) {
      console.error("Error fetching repository contents:", error);
      throw new Error("Failed to fetch repository contents");
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string = "main"
  ): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if ("content" in data && data.content) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      throw new Error("File content not found");
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw new Error("Failed to fetch file content");
    }
  }

  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch: string = "main"
  ): Promise<void> {
    try {
      const contentBuffer = Buffer.from(content, "utf-8");
      const encodedContent = contentBuffer.toString("base64");

      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: encodedContent,
        sha,
        branch,
      });
    } catch (error) {
      console.error("Error updating file:", error);
      throw new Error("Failed to update file");
    }
  }

  async createFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = "main"
  ): Promise<void> {
    try {
      const contentBuffer = Buffer.from(content, "utf-8");
      const encodedContent = contentBuffer.toString("base64");

      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: encodedContent,
        branch,
      });
    } catch (error) {
      console.error("Error creating file:", error);
      throw new Error("Failed to create file");
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = "main"
  ): Promise<void> {
    try {
      // First try to get the file to see if it exists
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });
        if ("sha" in data) {
          sha = data.sha;
        }
      } catch {
        // File doesn't exist, we'll create it
      }

      const contentBuffer = Buffer.from(content, "utf-8");
      const encodedContent = contentBuffer.toString("base64");

      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: encodedContent,
        sha, // Will be undefined for new files
        branch,
      });
    } catch (error) {
      console.error("Error creating or updating file:", error);
      throw new Error("Failed to create or update file");
    }
  }

  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string,
    branch: string = "main"
  ): Promise<void> {
    try {
      await this.octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha,
        branch,
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error("Failed to delete file");
    }
  }

  async createRepository(
    name: string,
    description?: string,
    isPrivate: boolean = false,
    autoInit: boolean = true,
    gitignoreTemplate?: string,
    licenseTemplate?: string
  ): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: autoInit,
        gitignore_template: gitignoreTemplate,
        license_template: licenseTemplate,
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        private: data.private,
        html_url: data.html_url,
        clone_url: data.clone_url,
        default_branch: data.default_branch,
        permissions: {
          admin: true, // User is admin of their own repo
          push: true,
          pull: true,
        },
      };
    } catch (error) {
      console.error("Error creating repository:", error);
      throw new Error("Failed to create repository");
    }
  }
}
