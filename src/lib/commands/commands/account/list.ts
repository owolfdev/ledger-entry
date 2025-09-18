import type { Command, CommandContext, CommandResult } from "../../types";

export const accountsCommand: Command = {
  name: "accounts",
  description: "List all available accounts",
  usage: "accounts",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    context.logger.addLog("success", "Available Accounts:");
    context.logger.addLog("info", "  Assets:Checking");
    context.logger.addLog("info", "  Expenses:Food:Groceries");
    context.logger.addLog("info", "  Expenses:Food:Dining");
    context.logger.addLog("info", "  Expenses:Housing:Rent");
    context.logger.addLog("info", "  Income:Salary");

    context.updateMessage(
      "All accounts listed. Use 'add transaction' to create new entries.",
      "success"
    );

    return {
      success: true,
      message:
        "All accounts listed. Use 'add transaction' to create new entries.",
    };
  },
};
