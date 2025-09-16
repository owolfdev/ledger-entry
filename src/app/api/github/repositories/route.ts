import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGitHubClient } from "@/lib/github/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const githubClient = await getGitHubClient();
    if (!githubClient) {
      return NextResponse.json(
        { error: "GitHub client not available" },
        { status: 500 }
      );
    }

    // Just get the repository list without scanning
    const repos = await githubClient.getUserRepositories();

    return NextResponse.json({
      repos,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
