import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGitHubClient } from "@/lib/github/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo are required" },
        { status: 400 }
      );
    }

    const githubClient = await getGitHubClient();
    if (!githubClient) {
      return NextResponse.json(
        { error: "GitHub client not available" },
        { status: 500 }
      );
    }

    if (path) {
      // Get specific file content
      try {
        const content = await githubClient.getFileContent(owner, repo, path);
        return NextResponse.json({ content, path });
      } catch (error) {
        console.error("Error getting file content:", error);
        return NextResponse.json(
          { error: "Failed to get file content" },
          { status: 404 }
        );
      }
    } else {
      // Get complete file tree for the repository
      try {
        const files = await githubClient.getRepositoryTree(owner, repo);
        return NextResponse.json({ files });
      } catch (error) {
        console.error("Error getting repository tree:", error);
        return NextResponse.json(
          { error: "Failed to get repository tree" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in files API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo, path, content, message } = body;

    if (!owner || !repo || !path || content === undefined) {
      return NextResponse.json(
        { error: "Owner, repo, path, and content are required" },
        { status: 400 }
      );
    }

    const githubClient = await getGitHubClient();
    if (!githubClient) {
      return NextResponse.json(
        { error: "GitHub client not available" },
        { status: 500 }
      );
    }

    try {
      await githubClient.createOrUpdateFile(
        owner,
        repo,
        path,
        content,
        message || `Update ${path}`
      );
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error updating file:", error);
      return NextResponse.json(
        { error: "Failed to update file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in files PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
