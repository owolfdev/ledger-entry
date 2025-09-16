import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGitHubClient } from "@/lib/github/server";
import { setConnectedRepo } from "@/lib/ledger/repo-db";
import { scanLedgerStructure } from "@/lib/ledger/repo-scanner";
import { addMissingFiles } from "@/lib/ledger/file-initializer";

export async function POST(request: NextRequest) {
  try {
    const { repoOwner, repoName, repoFullName } = await request.json();

    if (!repoOwner || !repoName || !repoFullName) {
      return NextResponse.json(
        { error: "Repository information is required" },
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

    // Scan the repository structure
    const structure = await scanLedgerStructure(
      githubClient,
      repoOwner,
      repoName
    );

    // If not compatible, try to add missing files
    if (!structure.isCompatible) {
      const initResult = await addMissingFiles(
        githubClient,
        repoOwner,
        repoName,
        structure.missingFiles,
        structure.missingFolders
      );

      if (!initResult.success) {
        return NextResponse.json(
          {
            error: "Failed to initialize repository structure",
            details: initResult.errors,
          },
          { status: 500 }
        );
      }

      // Re-scan after adding missing files
      const updatedStructure = await scanLedgerStructure(
        githubClient,
        repoOwner,
        repoName
      );

      if (!updatedStructure.isCompatible) {
        return NextResponse.json(
          {
            error: "Repository is still not compatible after initialization",
            missingFiles: updatedStructure.missingFiles,
            missingFolders: updatedStructure.missingFolders,
          },
          { status: 400 }
        );
      }
    }

    // Set as connected repository
    const success = await setConnectedRepo(
      user.id,
      repoOwner,
      repoName,
      repoFullName
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to connect repository" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Repository connected successfully",
      structure,
    });
  } catch (error) {
    console.error("Error connecting repository:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
