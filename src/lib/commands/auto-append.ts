/**
 * Auto-append logic for ledger entries
 */

import type { CommandContext } from "./types";
import type { ParsedLedgerEntry } from "./intent-detector";
import { validateLedgerEntry } from "./ledger-validator";

export interface AutoAppendResult {
  success: boolean;
  message: string;
  journalFile: string;
  created: boolean;
}

/**
 * Auto-append a ledger entry to the appropriate monthly journal file
 */
export async function autoAppendLedgerEntry(
  entry: ParsedLedgerEntry,
  context: CommandContext
): Promise<AutoAppendResult> {
  const journalFile = `journals/${entry.yearMonth}.journal`;

  // Check if we have repository info
  if (!context.repository) {
    const errorMessage =
      "No repository selected. Please select a repository first.";
    context.logger.addLog("error", errorMessage);
    context.updateMessage(errorMessage, "error");
    return {
      success: false,
      message: errorMessage,
      journalFile,
      created: false,
    };
  }

  // Validate the ledger entry
  context.logger.addLog("info", "🔍 Validating ledger entry...");
  const validation = validateLedgerEntry(entry);

  // Handle validation errors (block the transaction)
  if (!validation.isValid) {
    context.logger.addLog("error", "❌ Validation failed:");
    validation.errors.forEach((error) => {
      context.logger.addLog("error", `   • ${error.message}`);
      if (error.suggestion) {
        context.logger.addLog("info", `     💡 ${error.suggestion}`);
      }
    });

    const errorMessage =
      "Transaction validation failed. Please fix the errors above.";
    context.updateMessage(errorMessage, "error");
    return {
      success: false,
      message: errorMessage,
      journalFile,
      created: false,
    };
  }

  // Handle validation warnings (show but allow override)
  if (validation.warnings.length > 0) {
    context.logger.addLog("warning", "⚠️ Validation warnings:");
    validation.warnings.forEach((warning) => {
      context.logger.addLog("warning", `   • ${warning.message}`);
    });
    context.logger.addLog(
      "info",
      "   → Proceeding with transaction (warnings noted)"
    );
  }

  context.logger.addLog("success", "✅ Validation passed");

  try {
    // Add loading message
    const loadingLogId = Date.now().toString();
    context.logger.addLog(
      "loading",
      `📝 Processing ledger entry for ${entry.yearMonth}...`
    );

    // Add intermediate progress message
    setTimeout(() => {
      context.logger.addLog(
        "info",
        `   → Targeting journal file: ${journalFile}`
      );
    }, 200);

    let currentContent = "";
    let fileExists = false;

    try {
      // Try to load the target journal file directly from GitHub
      const response = await fetch(
        `/api/github/files?owner=${context.repository.owner}&repo=${
          context.repository.repo
        }&path=${encodeURIComponent(journalFile)}`
      );

      if (response.ok) {
        const data = await response.json();
        currentContent = data.content || "";
        fileExists = true;
        context.logger.addLog("info", `   → Loaded existing journal file`);
      } else {
        // File doesn't exist, we'll create it
        fileExists = false;
        context.logger.addLog(
          "info",
          `   → Journal file doesn't exist, will create new one`
        );
      }
    } catch {
      // File doesn't exist, we'll create it
      fileExists = false;
      context.logger.addLog(
        "info",
        `   → Journal file doesn't exist, will create new one`
      );
    }

    // Prepare the content to append
    const entryToAppend = formatLedgerEntry(entry, currentContent);

    // If file doesn't exist, create it with proper header
    if (!fileExists) {
      currentContent = createJournalFileHeader(entry.yearMonth);
    }

    // Append the new entry
    const newContent = currentContent + entryToAppend;

    // Save the file directly to GitHub
    const commitMessage = `entry: ${entry.date} ${entry.description} — ${entry.yearMonth}`;
    const saveResponse = await fetch("/api/github/files", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner: context.repository.owner,
        repo: context.repository.repo,
        path: journalFile,
        content: newContent,
        message: commitMessage,
      }),
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save file: ${saveResponse.statusText}`);
    }

    // Update main.journal if this is a new file
    if (!fileExists) {
      await updateMainJournal(context, entry.yearMonth, journalFile);
    }

    // Refresh repository items to show new files
    await refreshRepositoryItems(context);

    // If the appended file is currently open in editor, refresh its content
    if (context.fileOperations.currentFile?.path === journalFile) {
      await refreshCurrentFile(context, journalFile);
    }

    // Remove loading message and add success
    context.logger.setLogs(
      context.logger.logs.filter((log) => log.id !== loadingLogId)
    );

    context.logger.addLog("success", `✅ Entry appended to ${journalFile}`);
    context.updateMessage(`Transaction saved to ${journalFile}`, "success");

    return {
      success: true,
      message: `Transaction saved to ${journalFile}`,
      journalFile,
      created: !fileExists,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to append entry";
    context.logger.addLog(
      "error",
      `❌ Failed to append entry: ${errorMessage}`
    );
    context.updateMessage("Failed to save transaction", "error");

    return {
      success: false,
      message: `Failed to save transaction: ${errorMessage}`,
      journalFile,
      created: false,
    };
  }
}

/**
 * Format a ledger entry for appending to a journal file
 */
function formatLedgerEntry(
  entry: ParsedLedgerEntry,
  existingContent: string
): string {
  // Add spacing if the file already has content
  const needsSpacing =
    existingContent.trim().length > 0 && !existingContent.endsWith("\n");
  const spacing = needsSpacing ? "\n\n" : "";

  return `${spacing}${entry.fullContent}`;
}

/**
 * Create a header for a new journal file
 */
function createJournalFileHeader(yearMonth: string): string {
  return `; Ledger Entry — transactions for ${yearMonth}
; Generated on ${new Date().toISOString().split("T")[0]}

`;
}

/**
 * Refresh repository items to show new files
 */
async function refreshRepositoryItems(context: CommandContext): Promise<void> {
  try {
    context.logger.addLog("info", `   → Refreshing repository file list...`);

    if (context.refreshRepositoryItems) {
      await context.refreshRepositoryItems();
      context.logger.addLog("info", `   → Repository file list refreshed`);
    } else {
      context.logger.addLog(
        "warning",
        `   → Repository refresh callback not available`
      );
    }
  } catch (error) {
    context.logger.addLog(
      "warning",
      `   → Failed to refresh repository items: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Refresh the current file content if it matches the appended file
 */
async function refreshCurrentFile(
  context: CommandContext,
  journalFile: string
): Promise<void> {
  try {
    context.logger.addLog("info", `   → Refreshing editor content...`);

    // Reload the file content
    await context.fileOperations.loadFile(journalFile);

    context.logger.addLog("info", `   → Editor content refreshed`);
  } catch (error) {
    context.logger.addLog(
      "warning",
      `   → Failed to refresh editor content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Update main.journal to include a new monthly journal file
 */
async function updateMainJournal(
  context: CommandContext,
  yearMonth: string,
  journalFile: string
): Promise<void> {
  // This function is only called when context.repository is not null
  // (checked in the calling function), so we can safely use non-null assertion
  if (!context.repository) {
    context.logger.addLog(
      "error",
      "   → No repository available for main.journal update"
    );
    return;
  }

  try {
    context.logger.addLog(
      "info",
      `   → Updating main.journal to include ${journalFile}`
    );

    // Load main.journal directly from GitHub
    const mainResponse = await fetch(
      `/api/github/files?owner=${context.repository.owner}&repo=${context.repository.repo}&path=main.journal`
    );

    let mainContent = "";
    if (mainResponse.ok) {
      const mainData = await mainResponse.json();
      mainContent = mainData.content || "";
    }

    // Check if the include already exists
    const includeLine = `!include ${journalFile}`;
    if (mainContent.includes(includeLine)) {
      context.logger.addLog(
        "info",
        `   → main.journal already includes ${journalFile}`
      );
      return;
    }

    // Add the include line (after existing includes, before any other content)
    const lines = mainContent.split("\n");
    let insertIndex = lines.length;

    // Find the last include line
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith("!include")) {
        insertIndex = i + 1;
        break;
      }
    }

    // Insert the new include line
    lines.splice(insertIndex, 0, includeLine);
    const newMainContent = lines.join("\n");

    // Save the updated main.journal directly to GitHub
    const mainSaveResponse = await fetch("/api/github/files", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner: context.repository.owner,
        repo: context.repository.repo,
        path: "main.journal",
        content: newMainContent,
        message: `main: add ${journalFile} to includes`,
      }),
    });

    if (!mainSaveResponse.ok) {
      throw new Error(
        `Failed to update main.journal: ${mainSaveResponse.statusText}`
      );
    }

    context.logger.addLog(
      "success",
      `✅ Updated main.journal to include ${journalFile}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    context.logger.addLog(
      "error",
      `⚠️ Failed to update main.journal: ${errorMessage}`
    );
    // Don't throw - this is not critical for the main operation
  }
}
