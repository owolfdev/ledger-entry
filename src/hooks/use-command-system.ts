"use client";

import { useCallback } from "react";
import { commandRegistry } from "@/lib/commands/registry";
import { parseCommand, validateCommandInput } from "@/lib/commands/parser";
import { detectIntent } from "@/lib/commands/intent-detector";
import { autoAppendLedgerEntry } from "@/lib/commands/auto-append";
import type { CommandContext } from "@/lib/commands/types";

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

      // Neither command nor ledger entry
      context.logger.addLog(
        "error",
        "Invalid input. Enter a command (type 'help') or a ledger transaction."
      );
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
