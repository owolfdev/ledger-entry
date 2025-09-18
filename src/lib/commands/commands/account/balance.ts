import type { Command, CommandContext, CommandResult } from "../../types";

export const balanceCommand: Command = {
  name: "balance",
  aliases: ["bal"],
  description: "Show account balances",
  usage: "balance",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    context.logger.addLog("success", "Account Balances:");
    context.logger.addLog("info", "  Assets:Checking        $1,832.83");
    context.logger.addLog("info", "  Expenses:Food:Groceries   $45.67");
    context.logger.addLog("info", "  Expenses:Food:Dining      $12.50");
    context.logger.addLog("info", "  Expenses:Housing:Rent  $1,200.00");
    context.logger.addLog("info", "  Income:Salary         $-3,000.00");

    context.updateMessage(
      "Account balances displayed. Use 'accounts' to see all account names.",
      "success"
    );

    return {
      success: true,
      message:
        "Account balances displayed. Use 'accounts' to see all account names.",
    };
  },
};
