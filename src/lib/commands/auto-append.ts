/**
 * Auto-append logic for ledger entries
 */

import type { CommandContext } from "./types";
import type { ParsedLedgerEntry } from "./intent-detector";
import { validateLedgerEntry } from "./ledger-validator";
import {
  detectAccountChanges,
  learnFromCorrection,
} from "./natural-language/learning";
import { ParsedAddCommand } from "./natural-language/parser";

interface ItemMapping {
  itemName: string;
  originalAccount: string;
  amount: number;
  currency: string;
}

interface AppliedRules {
  debitAccounts: Array<{
    account: string;
    amount: number;
    currency: string;
    itemName: string;
  }>;
  creditAccount: string;
  currency: string;
  entity: string;
  merchant?: string;
}

interface LastAddCommand {
  parsedCommand: ParsedAddCommand;
  appliedRules: AppliedRules;
  generatedEntry: string;
  itemMappings: ItemMapping[];
  timestamp: number;
}

declare global {
  interface Window {
    __lastAddCommand?: LastAddCommand;
  }
}

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

  // Handle validation warnings (show and request confirmation)
  if (validation.warnings.length > 0) {
    context.logger.addLog("warning", "⚠️ Validation warnings:");
    validation.warnings.forEach((warning) => {
      context.logger.addLog("warning", `   • ${warning.message}`);
    });

    // Request user confirmation if confirmation system is available
    if (context.requestConfirmation) {
      context.logger.addLog("info", "");
      const confirmed = await context.requestConfirmation(
        "Do you want to continue with this transaction despite the warnings? (y/n)"
      );

      if (!confirmed) {
        context.logger.addLog("info", "❌ Transaction cancelled by user");
        context.updateMessage("Transaction cancelled", "warning");
        return {
          success: false,
          message: "Transaction cancelled due to warnings",
          journalFile,
          created: false,
        };
      }

      context.logger.addLog(
        "success",
        "✅ Proceeding with transaction (warnings acknowledged)"
      );
    } else {
      context.logger.addLog(
        "info",
        "   → Proceeding with transaction (warnings noted)"
      );
    }
  }

  context.logger.addLog("success", "✅ Validation passed");

  try {
    // Add loading message
    const loadingLogId = Date.now().toString();
    context.logger.addLog(
      "loading",
      `📝 Processing ledger entry for ${entry.yearMonth}`
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

    // Check for learning opportunities when journal files are saved
    if (
      journalFile.startsWith("journals/") &&
      journalFile.endsWith(".journal")
    ) {
      try {
        // Check if we have a recent add command context
        const lastAddCommand =
          typeof window !== "undefined" ? window.__lastAddCommand : null;

        if (lastAddCommand) {
          // Check if the command is recent (within last 5 minutes)
          const commandAge = Date.now() - lastAddCommand.timestamp;

          if (commandAge <= 5 * 60 * 1000) {
            // Detect account changes - compare original with the new entry being added
            const newEntry = entryToAppend.trim();

            const changes = detectAccountChanges(
              lastAddCommand.generatedEntry,
              newEntry,
              lastAddCommand.itemMappings
            );

            if (changes.length > 0) {
              // Show prominent change detection message
              context.logger.addLog("warning", `🔍 ACCOUNT CHANGE DETECTED!`);
              context.logger.addLog(
                "warning",
                `   The system detected that you modified account names in your entry.`
              );

              for (const change of changes) {
                context.logger.addLog("info", `   Item: "${change.itemName}"`);
                context.logger.addLog(
                  "info",
                  `   Original: ${change.originalAccount}`
                );
                context.logger.addLog(
                  "info",
                  `   Modified: ${change.finalAccount}`
                );
                context.logger.addLog(
                  "info",
                  `   Amount: ${change.amount} ${change.currency}`
                );

                // Attempt to learn from the change
                const learningContext = {
                  owner: context.repository.owner,
                  repo: context.repository.repo,
                  originalCommand: lastAddCommand.parsedCommand,
                  originalAccount: change.originalAccount,
                  finalAccount: change.finalAccount,
                  itemName: change.itemName,
                };

                context.logger.addLog(
                  "info",
                  `🧠 Learning rule for "${change.itemName}"...`
                );

                const learned = await learnFromCorrection(learningContext);
                if (learned) {
                  context.logger.addLog("success", `🧠 LEARNED NEW RULE:`);
                  context.logger.addLog(
                    "success",
                    `   Pattern: "(?i)${change.itemName}"`
                  );
                  context.logger.addLog(
                    "success",
                    `   Account: ${change.finalAccount}`
                  );
                  context.logger.addLog("success", `   Confidence: 0.8`);
                  context.logger.addLog(
                    "success",
                    `   ✅ This rule will be used for future "${change.itemName}" entries!`
                  );

                  // Invalidate rules cache so the new rule is immediately available
                  try {
                    const { invalidateRulesCache } = await import(
                      "./natural-language/rules-engine"
                    );
                    invalidateRulesCache(
                      context.repository.owner,
                      context.repository.repo
                    );
                    context.logger.addLog(
                      "info",
                      `🔄 Rules cache invalidated - new rule is now active!`
                    );
                  } catch (_error) {
                    // console.warn(
                    //   "Failed to invalidate rules cache after learning:",
                    //   error
                    // );
                    context.logger.addLog(
                      "warning",
                      `⚠️ New rule saved but cache not refreshed - restart may be needed`
                    );
                  }
                } else {
                  context.logger.addLog("error", `❌ LEARNING FAILED:`);
                  context.logger.addLog(
                    "error",
                    `   Could not save rule for "${change.itemName}"`
                  );
                }
              }
            }
            // Only show "no changes" message if we actually checked for changes
            // (Don't show it if there's no context or it's too old)

            // Clear the stored command context after learning
            if (typeof window !== "undefined") {
              delete window.__lastAddCommand;
            }
          }
          // Don't show messages for old commands - just silently skip
        }
        // Don't show messages when there's no context - just silently skip
      } catch (_error) {
        // console.warn("Learning system error:", error);
        context.logger.addLog("error", "❌ Learning system error");
      }
    }

    // Invalidate rules cache if a rule file was saved (unlikely but possible)
    if (journalFile.startsWith("rules/") && journalFile.endsWith(".json")) {
      try {
        const { invalidateRulesCache } = await import(
          "./natural-language/rules-engine"
        );
        invalidateRulesCache(context.repository.owner, context.repository.repo);
      } catch (_error) {
        // console.warn("Failed to invalidate rules cache:", error);
      }
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
  } catch (_error) {
    const errorMessage =
      _error instanceof Error ? _error.message : "Failed to append entry";
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
  } catch (_error) {
    context.logger.addLog(
      "warning",
      `   → Failed to refresh repository items: ${
        _error instanceof Error ? _error.message : "Unknown error"
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
  } catch (_error) {
    context.logger.addLog(
      "warning",
      `   → Failed to refresh editor content: ${
        _error instanceof Error ? _error.message : "Unknown error"
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
  } catch (_error) {
    const errorMessage =
      _error instanceof Error ? _error.message : "Unknown error";
    context.logger.addLog(
      "error",
      `⚠️ Failed to update main.journal: ${errorMessage}`
    );
    // Don't throw - this is not critical for the main operation
  }
}
