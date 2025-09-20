import type { Command, CommandContext, CommandResult } from "../../types";

export const clearCommand: Command = {
  name: "clear",
  description: "Clear terminal output",
  usage: "clear",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    // Clear all pending timeouts to prevent async logs from appearing after clear
    context.logger.clearAllTimeouts();

    // Clear all logs including the command that was just logged
    context.logger.setLogs([]);

    // Update the message area to show that terminal was cleared
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
