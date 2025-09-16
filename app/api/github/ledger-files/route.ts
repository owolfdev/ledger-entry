import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GitHubClient } from "@/lib/github/client";
import { generateLedgerStructure } from "@/lib/ledger/structure";
import { getTemplateById } from "@/lib/ledger/templates";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repository, templateId, pat } = body;

    if (!repository || !templateId) {
      return NextResponse.json(
        { error: "Repository and template ID are required" },
        { status: 400 }
      );
    }

    // Get the template
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    // Create GitHub client with PAT
    const githubClient = new GitHubClient(pat);

    // Generate ledger structure
    const structure = generateLedgerStructure(template);

    const results = {
      success: true,
      createdFiles: [] as string[],
      errors: [] as string[],
      repository: repository,
    };

    // Parse repository owner and name
    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Invalid repository format. Expected "owner/repo"' },
        { status: 400 }
      );
    }

    // Create each file in the repository
    for (const file of structure.files) {
      try {
        // Check if file already exists
        try {
          await githubClient.getFileContent(owner, repo, file.path);
          // File exists, skip or update
          results.errors.push(`File ${file.path} already exists, skipping`);
          continue;
        } catch (error) {
          // File doesn't exist, create it
        }

        // Create the file
        await githubClient.createFile(
          owner,
          repo,
          file.path,
          file.content,
          `ledger: bootstrap ${template.name} template files`
        );

        results.createdFiles.push(file.path);
      } catch (error) {
        console.error(`Error creating file ${file.path}:`, error);
        results.errors.push(
          `Failed to create ${file.path}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Update main.journal to include the current month's entries
    try {
      const mainJournalContent = `; Ledger Entry — main journal file
; This file includes all other journal files
; Generated on ${new Date().toISOString().split("T")[0]}

${structure.mainJournalIncludes
  .map((include) => `!include ${include}`)
  .join("\n")}
`;

      await githubClient.createOrUpdateFile(
        owner,
        repo,
        "main.journal",
        mainJournalContent,
        `ledger: update main.journal with current month includes`
      );

      if (!results.createdFiles.includes("main.journal")) {
        results.createdFiles.push("main.journal");
      }
    } catch (error) {
      console.error("Error updating main.journal:", error);
      results.errors.push(
        `Failed to update main.journal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in ledger files API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
