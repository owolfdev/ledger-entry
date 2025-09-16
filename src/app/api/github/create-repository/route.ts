import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGitHubClient } from "@/lib/github/server";
import { initializeLedgerStructure } from "@/lib/ledger/file-initializer";
import { setConnectedRepo } from "@/lib/ledger/repo-db";

export async function POST(request: NextRequest) {
  try {
    console.log("Create repository API called");
    const { name, description, isPrivate = true } = await request.json();
    console.log("Request data:", { name, description, isPrivate });
    console.log("Timestamp:", new Date().toISOString());

    if (!name) {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("User authentication error:", userError);
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", user.email);
    const githubClient = await getGitHubClient();
    if (!githubClient) {
      console.log("GitHub client not available");
      return NextResponse.json(
        { error: "GitHub client not available" },
        { status: 500 }
      );
    }

    console.log("GitHub client created successfully");

    // Check rate limit status before making the call
    try {
      const rateLimitResponse = await fetch(
        "https://api.github.com/rate_limit",
        {
          headers: {
            Authorization: `token ${githubClient.getAuthToken()}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (rateLimitResponse.ok) {
        const rateLimitData = await rateLimitResponse.json();
        console.log("GitHub rate limit status:", {
          remaining: rateLimitData.rate.remaining,
          limit: rateLimitData.rate.limit,
          reset: new Date(rateLimitData.rate.reset * 1000).toISOString(),
        });
      }
    } catch (rateLimitError) {
      console.log("Could not check rate limit:", rateLimitError);
    }

    // Create the repository
    console.log("Creating repository with options:", {
      name,
      description: description || "Ledger Entry - Personal Finance Tracker",
      private: isPrivate,
      autoInit: false,
    });

    const repo = await githubClient.createRepository({
      name,
      description: description || "Ledger Entry - Personal Finance Tracker",
      private: isPrivate,
      autoInit: false, // We'll initialize with our own files
    });

    console.log("Repository created:", repo);

    if (!repo) {
      console.log("Repository creation returned null");
      return NextResponse.json(
        { error: "Failed to create repository" },
        { status: 500 }
      );
    }

    // Initialize the repository with ledger structure
    console.log("Initializing ledger structure for repo:", repo.full_name);
    const [owner, repoName] = repo.full_name.split("/");

    const initResult = await initializeLedgerStructure(
      githubClient,
      owner,
      repoName
    );

    if (!initResult.success) {
      // If initialization failed, we should probably delete the repo
      // But for now, just return an error
      return NextResponse.json(
        {
          error:
            "Repository created but failed to initialize with ledger structure",
          details: initResult.errors,
        },
        { status: 500 }
      );
    }

    // Set as connected repository
    console.log("Setting connected repo:", {
      owner,
      repoName,
      fullName: repo.full_name,
    });
    const success = await setConnectedRepo(
      user.id,
      owner,
      repoName,
      repo.full_name
    );

    if (!success) {
      return NextResponse.json(
        { error: "Repository created but failed to connect" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Repository created and initialized successfully",
      repository: {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        default_branch: repo.default_branch,
        permissions: {
          admin: true,
          push: true,
          pull: true,
        },
      },
      initialization: initResult,
    });
  } catch (error) {
    console.error("Error creating repository:", error);

    // Check if it's a GitHub API error
    if (error && typeof error === "object" && "status" in error) {
      const githubError = error as { status: number; message?: string };
      if (githubError.status === 422) {
        // Repository name already exists
        return NextResponse.json(
          {
            error:
              "Repository name already exists. Please choose a different name.",
          },
          { status: 422 }
        );
      } else if (githubError.status === 403) {
        // Check if it's a rate limit error
        if (githubError.message?.includes("rate limit exceeded")) {
          return NextResponse.json(
            {
              error:
                "GitHub API rate limit exceeded. Please wait a few minutes before trying again. You can also try selecting an existing repository instead.",
            },
            { status: 429 }
          );
        }
        // Other permission denied errors
        return NextResponse.json(
          { error: "Permission denied. Please check your GitHub access." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
