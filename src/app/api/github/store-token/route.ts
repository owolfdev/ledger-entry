import { createClient } from "@/lib/supabase/server";
import { storeGitHubToken } from "@/lib/github/token-handler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Validate token format (GitHub PATs start with ghp_, gho_, ghu_, ghs_, or ghr_)
    if (!token.match(/^gh[psou]_/)) {
      return NextResponse.json(
        { error: "Invalid GitHub token format" },
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

    // Store the token securely in the database
    const success = await storeGitHubToken(user.id, token);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to store token securely" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "GitHub token stored securely",
    });
  } catch (error) {
    console.error("Error in store-token API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
