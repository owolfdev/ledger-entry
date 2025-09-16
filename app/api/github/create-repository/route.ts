import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GitHubClient } from "@/lib/github/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      isPrivate = false,
      autoInit = true,
      gitignoreTemplate,
      licenseTemplate,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 }
      );
    }

    // Get GitHub token from user metadata
    const githubToken =
      user.user_metadata?.provider_token ||
      user.user_metadata?.github_token ||
      user.user_metadata?.access_token ||
      user.app_metadata?.provider_token ||
      user.app_metadata?.github_token;

    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub token not found" },
        { status: 400 }
      );
    }

    const githubClient = new GitHubClient(githubToken);
    const repository = await githubClient.createRepository(
      name,
      description,
      isPrivate,
      autoInit,
      gitignoreTemplate,
      licenseTemplate
    );

    return NextResponse.json({ repository });
  } catch (error) {
    console.error("Error creating repository:", error);
    return NextResponse.json(
      { error: "Failed to create repository" },
      { status: 500 }
    );
  }
}
