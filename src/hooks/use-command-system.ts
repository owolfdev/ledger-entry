"use client";

import { useCallback } from "react";
import { commandRegistry } from "@/lib/commands/registry";
import { parseCommand, validateCommandInput } from "@/lib/commands/parser";
import { detectIntent } from "@/lib/commands/intent-detector";
import { autoAppendLedgerEntry } from "@/lib/commands/auto-append";
import type { CommandContext } from "@/lib/commands/types";

/**
 * Get helpful suggestions for transaction format issues
 */
function getTransactionFormatSuggestion(input: string): string | null {
  const lines = input.trim().split("\n");
  if (lines.length < 2) return null;

  const firstLine = lines[0].trim();

  // Check if it looks like a transaction (starts with date-like pattern)
  const looksLikeTransaction = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(
    firstLine
  );
  if (!looksLikeTransaction) return null;

  // Check for specific date format issues
  const dateMatch = firstLine.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!dateMatch) return null;

  const [, year, month, day] = dateMatch;

  // Check for zero-padding issues
  if (month.length === 1 || day.length === 1) {
    return "Dates must be formatted as YYYY/MM/DD with zero-padding (e.g., 2025/02/15, not 2025/2/15)";
  }

  // Check for other common format issues
  if (!/^\d{4}\/\d{2}\/\d{2}/.test(firstLine)) {
    return "Dates must use forward slashes (/) not dashes (-) in YYYY/MM/DD format";
  }

  // Check for invalid date components
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);

  if (monthNum < 1 || monthNum > 12) {
    return `Invalid month: ${month}. Month must be between 01 and 12`;
  }

  if (dayNum < 1 || dayNum > 31) {
    return `Invalid day: ${day}. Day must be between 01 and 31`;
  }

  // Check if date actually exists
  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return `Invalid date: ${firstLine.split(" ")[0]} does not exist`;
  }

  // Check for transaction structure issues
  const accountLines = lines.slice(1);
  if (accountLines.length === 0) {
    return "Transaction must have account lines after the date. Format: Account:Name    Amount";
  }

  // Check for proper indentation
  const hasIndentedLines = accountLines.some(
    (line) => line.startsWith("    ") || line.startsWith("\t")
  );
  if (!hasIndentedLines) {
    return "Account lines must be indented with 4 spaces or a tab";
  }

  return null;
}

// Import all commands to register them
import {
  balanceCommand,
  accountsCommand,
} from "@/lib/commands/commands/account";
import {
  filesCommand,
  loadCommand,
  saveCommand,
  journalsCommand,
  rulesCommand,
} from "@/lib/commands/commands/file";
import { addCommand } from "@/lib/commands/commands/transaction";
import {
  helpCommand,
  clearCommand,
  validateCommand,
} from "@/lib/commands/commands/system";

// Register all commands
commandRegistry.register(balanceCommand);
commandRegistry.register(accountsCommand);
commandRegistry.register(filesCommand);
commandRegistry.register(loadCommand);
commandRegistry.register(saveCommand);
commandRegistry.register(journalsCommand);
commandRegistry.register(rulesCommand);
commandRegistry.register(addCommand);
commandRegistry.register(helpCommand);
commandRegistry.register(clearCommand);
commandRegistry.register(validateCommand);

interface UseCommandSystemProps {
  context: CommandContext;
}

export function useCommandSystem({ context }: UseCommandSystemProps) {
  const executeCommand = useCallback(
    async (input: string) => {
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      // Detect intent first
      const intent = detectIntent(trimmedInput);

      // Handle ledger entries
      if (intent.isLedgerEntry && intent.ledgerEntry) {
        try {
          context.logger.addLog("info", `> ${trimmedInput.split("\n")[0]}...`);
          const result = await autoAppendLedgerEntry(
            intent.ledgerEntry,
            context
          );

          if (!result.success) {
            context.updateMessage(result.message, "error");
          }
          return;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to process ledger entry";
          context.logger.addLog("error", errorMessage);
          context.updateMessage(errorMessage, "error");
          return;
        }
      }

      // Handle commands (existing logic)
      if (intent.isCommand) {
        // Validate input
        const validation = validateCommandInput(trimmedInput);
        if (!validation.valid) {
          context.logger.addLog(
            "error",
            validation.error || "Invalid command input"
          );
          return;
        }

        // Parse command
        const { command, args } = parseCommand(trimmedInput);
        if (!command) {
          return;
        }

        // Add command to logs (except for clear command to avoid logging it)
        if (command !== "clear") {
          context.logger.addLog("info", `> ${trimmedInput}`);
        }

        try {
          // Execute command through registry
          const result = await commandRegistry.execute(command, args, context);

          // Handle result
          if (!result.success && result.message) {
            context.updateMessage(result.message, "error");
          } else if (result.message) {
            context.updateMessage(result.message, "success");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Command execution failed";
          context.logger.addLog("error", errorMessage);
          context.updateMessage(errorMessage, "error");
        }
        return;
      }

      // Neither command nor ledger entry - check if it looks like a transaction with bad format
      const suggestion = getTransactionFormatSuggestion(trimmedInput);

      context.logger.addLog(
        "error",
        "Invalid input. Enter a command (type 'help') or a ledger transaction."
      );

      if (suggestion) {
        context.logger.addLog("info", "");
        context.logger.addLog("info", trimmedInput);
        context.logger.addLog("error", suggestion);
      }

      context.updateMessage(
        "Invalid input. Enter a command or ledger transaction.",
        "error"
      );
    },
    [context]
  );

  const getAvailableCommands = useCallback(() => {
    return commandRegistry.getAll();
  }, []);

  const findCommand = useCallback((name: string) => {
    return commandRegistry.findByNameOrAlias(name);
  }, []);

  return {
    executeCommand,
    getAvailableCommands,
    findCommand,
    registry: commandRegistry,
  };
}
