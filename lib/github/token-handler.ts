import { createClient } from "@/lib/supabase/server";

export async function storeGitHubToken(userId: string, token: string) {
  try {
    const supabase = await createClient();

    // Store the token in user metadata
    const { error } = await supabase.auth.updateUser({
      data: {
        github_token: token,
        provider_token: token,
      },
    });

    if (error) {
      console.error("Error storing GitHub token:", error);
      return false;
    }

    console.log("GitHub token stored successfully");
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

    return (
      user.user_metadata?.github_token ||
      user.user_metadata?.provider_token ||
      null
    );
  } catch (error) {
    console.error("Error getting stored GitHub token:", error);
    return null;
  }
}
