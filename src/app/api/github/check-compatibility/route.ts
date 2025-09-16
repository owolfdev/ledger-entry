import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGitHubClient } from "@/lib/github/server";
import { scanLedgerStructure } from "@/lib/ledger/repo-scanner";

export async function POST(request: NextRequest) {
  try {
    const { owner, repo } = await request.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo are required" },
        { status: 400 }
      );
    }

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

    // Only scan the selected repository
    const ledgerStructure = await scanLedgerStructure(
      githubClient,
      owner,
      repo
    );

    return NextResponse.json({
      owner,
      repo,
      ledgerStructure,
    });
  } catch (error) {
    console.error("Error checking repository compatibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
