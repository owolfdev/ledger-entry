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

  async createRepository(options: {
    name: string;
    description?: string;
    private?: boolean;
    autoInit?: boolean;
    gitignoreTemplate?: string;
    licenseTemplate?: string;
  }): Promise<GitHubRepository> {
    try {
      console.log("GitHub client createRepository called with:", options);

      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.private ?? false,
        auto_init: options.autoInit ?? true,
        gitignore_template: options.gitignoreTemplate,
        license_template: options.licenseTemplate,
      });

      console.log("GitHub API response:", data);

      const result = {
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

      console.log("Returning repository:", result);
      return result;
    } catch (error) {
      console.error("Error creating repository:", error);
      throw new Error("Failed to create repository");
    }
  }

  async getFile(
    owner: string,
    repo: string,
    path: string
  ): Promise<GitHubFile | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if ("content" in data) {
        return {
          name: data.name,
          path: data.path,
          type: data.type as "file" | "dir",
          size: data.size,
          download_url: data.download_url,
          content: data.content
            ? Buffer.from(data.content, "base64").toString("utf-8")
            : undefined,
          sha: data.sha,
        };
      }
      return null;
    } catch {
      // File doesn't exist
      return null;
    }
  }

  async getDirectoryContents(
    owner: string,
    repo: string,
    path: string
  ): Promise<GitHubFile[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
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
      }
      return [];
    } catch {
      // Directory doesn't exist
      return [];
    }
  }
}
