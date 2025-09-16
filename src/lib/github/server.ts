import { createClient } from "@/lib/supabase/server";
import { getStoredGitHubToken } from "./token-handler";
import { GitHubClient } from "./client";

export async function getGitHubClient(): Promise<GitHubClient | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("No user found");
      return null;
    }

    console.log("User found:", user.email);

    // First try to get token from secure database storage
    let githubToken = await getStoredGitHubToken();

    // Fallback to OAuth token if no PAT is stored
    if (!githubToken) {
      console.log("No PAT found in database, checking OAuth token");
      githubToken =
        user.user_metadata?.provider_token ||
        user.user_metadata?.github_token ||
        user.user_metadata?.access_token ||
        user.app_metadata?.provider_token ||
        user.app_metadata?.github_token;
    }

    if (!githubToken) {
      console.log("No GitHub token found");
      return null;
    }

    console.log("GitHub token found, creating client");
    return new GitHubClient(githubToken);
  } catch (error) {
    console.error("Error creating GitHub client:", error);
    return null;
  }
}

export async function getUserGitHubRepositories() {
  const githubClient = await getGitHubClient();

  if (!githubClient) {
    return [];
  }

  try {
    return await githubClient.getUserRepositories();
  } catch (error) {
    console.error("Error fetching user repositories:", error);
    return [];
  }
}
