import type { Command, CommandContext, CommandResult } from "../../types";

export const helpCommand: Command = {
  name: "help",
  description: "Show available commands",
  usage: "help",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    context.logger.addLog("info", "📖 Available commands:");
    context.logger.addLog("info", "");
    context.logger.addLog("info", "📊 Account & Balance Commands:");
    context.logger.addLog("info", "  balance, bal     - Show account balances");
    context.logger.addLog("info", "  accounts         - List all accounts");
    context.logger.addLog("info", "");
    context.logger.addLog("info", "📁 File Management Commands:");
    context.logger.addLog(
      "info",
      "  files            - List all files in repository"
    );
    context.logger.addLog(
      "info",
      "  journals         - List journal files in /journals folder"
    );
    context.logger.addLog(
      "info",
      "  rules            - List rule files in /rules folder"
    );
    context.logger.addLog("info", "  accounts         - List account files");
    context.logger.addLog(
      "info",
      "  load <filepath>  - Load a file from repository"
    );
    context.logger.addLog("info", "  save             - Save current file");
    context.logger.addLog("info", "");
    context.logger.addLog("info", "✏️ Transaction Commands:");
    context.logger.addLog(
      "info",
      "  add transaction  - Add transaction template"
    );
    context.logger.addLog("info", "");
    context.logger.addLog("info", "🔧 Utility Commands:");
    context.logger.addLog(
      "info",
      "  validate         - Validate ledger entries"
    );
    context.logger.addLog("info", "  clear            - Clear terminal output");
    context.logger.addLog(
      "info",
      "  help             - Show this help message"
    );
    context.logger.addLog("info", "");
    context.logger.addLog(
      "success",
      "💡 Try 'files' to see repository structure or 'journals' for journal files"
    );

    context.updateMessage(
      "Help displayed! Try 'files' to see available files.",
      "info"
    );

    return {
      success: true,
      message: "Help displayed! Try 'files' to see available files.",
    };
  },
};
