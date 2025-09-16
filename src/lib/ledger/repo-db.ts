import { createClient } from "@/lib/supabase/server";

export interface ConnectedRepo {
  id: string;
  user_id: string;
  repo_owner: string;
  repo_name: string;
  repo_full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the currently connected repository for a user
 */
export async function getConnectedRepo(
  userId: string
): Promise<ConnectedRepo | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_ledger_repos")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null;
      }
      console.error("Error getting connected repo:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting connected repo:", error);
    return null;
  }
}

/**
 * Set a repository as the connected repository for a user
 */
export async function setConnectedRepo(
  userId: string,
  repoOwner: string,
  repoName: string,
  repoFullName: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // First, deactivate any existing active repo
    await supabase
      .from("user_ledger_repos")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    // Insert new active repo
    const { error } = await supabase.from("user_ledger_repos").insert({
      user_id: userId,
      repo_owner: repoOwner,
      repo_name: repoName,
      repo_full_name: repoFullName,
      is_active: true,
    });

    if (error) {
      console.error("Error setting connected repo:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error setting connected repo:", error);
    return false;
  }
}

/**
 * Disconnect the current repository
 */
export async function disconnectRepo(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("user_ledger_repos")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Error disconnecting repo:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error disconnecting repo:", error);
    return false;
  }
}

/**
 * Get all repositories for a user (including inactive ones)
 */
export async function getUserRepos(userId: string): Promise<ConnectedRepo[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_ledger_repos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting user repos:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting user repos:", error);
    return [];
  }
}
