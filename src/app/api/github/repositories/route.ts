import { NextResponse } from "next/server";
import { getUserGitHubRepositories } from "@/lib/github/server";
import { getPublicRepositories } from "@/lib/github/public";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Try to get repositories with GitHub token first
    let repositories = await getUserGitHubRepositories();

    // If no repositories found (likely due to missing token), try public API
    if (repositories.length === 0) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata?.user_name) {
        console.log(
          "Falling back to public GitHub API for user:",
          user.user_metadata.user_name
        );
        repositories = await getPublicRepositories(
          user.user_metadata.user_name
        );
      }
    }

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
