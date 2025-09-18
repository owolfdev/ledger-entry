"use client";

import { useCallback } from "react";
import { commandRegistry } from "@/lib/commands/registry";
import { parseCommand, validateCommandInput } from "@/lib/commands/parser";
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
      // Validate input
      const validation = validateCommandInput(input);
      if (!validation.valid) {
        context.logger.addLog(
          "error",
          validation.error || "Invalid command input"
        );
        return;
      }

      // Parse command
      const { command, args } = parseCommand(input);
      if (!command) {
        return;
      }

      // Add command to logs
      context.logger.addLog("info", `> ${input}`);

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
