import { NextRequest, NextResponse } from "next/server";
import { getGitHubClient } from "@/lib/github/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; path: string }> }
) {
  try {
    const { owner, repo, path } = await params;
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch") || "main";

    const githubClient = await getGitHubClient();

    if (!githubClient) {
      // Fallback to public API if no authenticated client
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch file content" },
          { status: response.status }
        );
      }

      const data = await response.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return new NextResponse(content, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const content = await githubClient.getFileContent(
      owner,
      repo,
      path,
      branch
    );
    return new NextResponse(content, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error fetching file content:", error);
    return NextResponse.json(
      { error: "Failed to fetch file content" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; path: string }> }
) {
  try {
    const { owner, repo, path } = await params;
    const body = await request.json();
    const { content, message, branch = "main" } = body;

    if (!content || !message) {
      return NextResponse.json(
        { error: "Content and message are required" },
        { status: 400 }
      );
    }

    const githubClient = await getGitHubClient();

    if (!githubClient) {
      return NextResponse.json(
        { error: "GitHub authentication required for file updates" },
        { status: 401 }
      );
    }

    // Get the current file to get its SHA (required for updates)
    let sha: string | undefined;
    try {
      const currentFile = await githubClient.getRepositoryContents(
        owner,
        repo,
        path,
        branch
      );
      if (currentFile.length > 0 && currentFile[0].sha) {
        sha = currentFile[0].sha;
      }
    } catch {
      // File might not exist, which is fine for creating new files
      console.log("File might not exist, creating new file");
    }

    await githubClient.updateFile(
      owner,
      repo,
      path,
      content,
      message,
      sha,
      branch
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}
