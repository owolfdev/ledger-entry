/**
 * Auto-append logic for ledger entries
 */

import type { CommandContext, CommandResult } from "./types";
import type { ParsedLedgerEntry } from "./intent-detector";

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
      // Try to load the current journal file
      await context.fileOperations.loadFile(journalFile);
      currentContent = context.fileOperations.currentFile?.content || "";
      fileExists = true;
      context.logger.addLog("info", `   → Loaded existing journal file`);
    } catch (error) {
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

    // Save the file
    const commitMessage = `entry: ${entry.date} ${entry.description} — ${entry.yearMonth}`;
    await context.fileOperations.saveFile(newContent, commitMessage);

    // Update main.journal if this is a new file
    if (!fileExists) {
      await updateMainJournal(context, entry.yearMonth, journalFile);
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
 * Update main.journal to include a new monthly journal file
 */
async function updateMainJournal(
  context: CommandContext,
  yearMonth: string,
  journalFile: string
): Promise<void> {
  try {
    context.logger.addLog(
      "info",
      `   → Updating main.journal to include ${journalFile}`
    );

    // Load main.journal
    await context.fileOperations.loadFile("main.journal");
    let mainContent = context.fileOperations.currentFile?.content || "";

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

    // Save the updated main.journal
    await context.fileOperations.saveFile(
      newMainContent,
      `main: add ${journalFile} to includes`
    );

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
