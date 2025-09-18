import type { Command, CommandContext, CommandResult } from "../../types";

export const clearCommand: Command = {
  name: "clear",
  description: "Clear terminal output",
  usage: "clear",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    context.logger.setLogs([]);
    context.updateMessage(
      "Terminal cleared. Type 'help' for available commands.",
      "info"
    );

    return {
      success: true,
      message: "Terminal cleared. Type 'help' for available commands.",
    };
  },
};
