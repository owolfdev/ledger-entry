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
    context.logger.addLog(
      "info",
      "  load -j <journal> - Load journal with shortcuts:"
    );
    context.logger.addLog(
      "info",
      "                   • current - current month"
    );
    context.logger.addLog(
      "info",
      "                   • latest - most recent journal"
    );
    context.logger.addLog(
      "info",
      "                   • <month> - specific month (1-12)"
    );
    context.logger.addLog(
      "info",
      "                   • <month-name> - specific month (january, sep, etc.)"
    );
    context.logger.addLog(
      "info",
      "                   • <year-month> - specific YYYY-MM"
    );
    context.logger.addLog("info", "  save             - Save current file");
    context.logger.addLog("info", "");
    context.logger.addLog("info", "✏️ Transaction Commands:");
    context.logger.addLog(
      "info",
      "  add transaction  - Add transaction template"
    );
    context.logger.addLog("info", "");
    context.logger.addLog("info", "📝 Direct Transaction Entry:");
    context.logger.addLog(
      "info",
      "  You can also type ledger transactions directly:"
    );
    context.logger.addLog("info", "  2025/09/15 Example Transaction");
    context.logger.addLog("info", "      Personal:Expenses:Food    10.00 USD");
    context.logger.addLog("info", "      Personal:Assets:Bank     -10.00 USD");
    context.logger.addLog(
      "info",
      "  Transactions are automatically saved to journals/YYYY-MM.journal"
    );
    context.logger.addLog(
      "info",
      "  Note: Use zero-padded dates (2025/09/15, not 2025/9/15)"
    );
    context.logger.addLog("info", "");
    context.logger.addLog("info", "🔍 Validation Features:");
    context.logger.addLog(
      "info",
      "  • Date validation (zero-padded YYYY/MM/DD format required)"
    );
    context.logger.addLog(
      "info",
      "  • Balance checking (debits must equal credits)"
    );
    context.logger.addLog(
      "info",
      "  • Date range warnings (outside current year ±2)"
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
      "💡 Try 'files' to see repository structure, 'journals' for journal files, or type a ledger transaction directly!"
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
