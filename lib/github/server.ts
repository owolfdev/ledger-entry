import { createClient } from "@/lib/supabase/server";
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
    console.log("User metadata:", user.user_metadata);
    console.log("App metadata:", user.app_metadata);

    // Get the GitHub access token from the user's metadata
    // GitHub OAuth stores the token in provider_token or app_metadata
    const githubToken =
      user.user_metadata?.provider_token ||
      user.user_metadata?.github_token ||
      user.user_metadata?.access_token ||
      user.app_metadata?.provider_token ||
      user.app_metadata?.github_token;

    if (!githubToken) {
      console.log("No GitHub token found in user metadata or app metadata");
      console.log(
        "Available keys in user_metadata:",
        Object.keys(user.user_metadata || {})
      );
      console.log(
        "Available keys in app_metadata:",
        Object.keys(user.app_metadata || {})
      );
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
