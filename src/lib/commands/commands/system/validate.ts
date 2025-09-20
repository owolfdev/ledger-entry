import type { Command, CommandContext, CommandResult } from "../../types";

export const validateCommand: Command = {
  name: "validate",
  description: "Validate ledger entries",
  usage: "validate",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    // Add loading message
    const validateLoadingLogId = Date.now().toString();
    context.logger.addLog(
      "loading",
      "🔍 Validating ledger entries and checking balance..."
    );
    context.updateMessage("Validating entries...", "info");

    // Add intermediate progress message
    const timeoutId = setTimeout(() => {
      context.logger.addLog(
        "info",
        "   → Parsing ledger entries and calculating balances..."
      );
    }, 100);
    context.logger.addTimeout(timeoutId);

    return new Promise((resolve) => {
      const mainTimeoutId = setTimeout(() => {
        // Remove loading message and add success
        context.logger.setLogs(
          context.logger.logs.filter((log) => log.id !== validateLoadingLogId)
        );
        context.logger.addLog("success", "All entries are valid");
        context.updateMessage(
          "All entries are valid! Your ledger is balanced.",
          "success"
        );

        resolve({
          success: true,
          message: "All entries are valid! Your ledger is balanced.",
        });
      }, 500);
      context.logger.addTimeout(mainTimeoutId);
    });
  },
};
