import { createClient } from "@/lib/supabase/server";
import { encryptToken, decryptToken } from "@/lib/encryption";

export async function storeGitHubToken(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Encrypt the token before storing
    const encryptedToken = encryptToken(token);

    // Check if user already has a token stored
    const { data: existingToken } = await supabase
      .from("user_github_tokens")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingToken) {
      // Update existing token
      const { error } = await supabase
        .from("user_github_tokens")
        .update({
          encrypted_pat: encryptedToken,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating GitHub token:", error);
        return false;
      }
    } else {
      // Insert new token
      const { error } = await supabase.from("user_github_tokens").insert({
        user_id: userId,
        encrypted_pat: encryptedToken,
      });

      if (error) {
        console.error("Error storing GitHub token:", error);
        return false;
      }
    }

    console.log("GitHub token stored successfully in database");
    return true;
  } catch (error) {
    console.error("Error storing GitHub token:", error);
    return false;
  }
}

export async function getStoredGitHubToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Get encrypted token from database
    const { data: tokenData, error } = await supabase
      .from("user_github_tokens")
      .select("encrypted_pat")
      .eq("user_id", user.id)
      .single();

    if (error || !tokenData) {
      console.log("No GitHub token found in database");
      return null;
    }

    // Decrypt the token
    const decryptedToken = decryptToken(tokenData.encrypted_pat);
    return decryptedToken;
  } catch (error) {
    console.error("Error getting stored GitHub token:", error);
    return null;
  }
}

export async function deleteStoredGitHubToken(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase
      .from("user_github_tokens")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting GitHub token:", error);
      return false;
    }

    console.log("GitHub token deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting GitHub token:", error);
    return false;
  }
}
