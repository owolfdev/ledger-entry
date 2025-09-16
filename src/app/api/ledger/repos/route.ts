import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGitHubClient } from "@/lib/github/server";
import {
  scanUserRepositories,
  getCompatibleRepos,
  getIncompatibleRepos,
} from "@/lib/ledger/repo-scanner";
import { getConnectedRepo } from "@/lib/ledger/repo-db";

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

    // Scan all user repositories
    const allRepos = await scanUserRepositories(githubClient);
    const compatibleRepos = getCompatibleRepos(allRepos);
    const incompatibleRepos = getIncompatibleRepos(allRepos);

    // Get currently connected repo
    const connectedRepo = await getConnectedRepo(user.id);

    return NextResponse.json({
      allRepos,
      compatibleRepos,
      incompatibleRepos,
      connectedRepo,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
