import type { Command, CommandContext, CommandResult } from "../../types";

export const addCommand: Command = {
  name: "add",
  description: "Add transaction template",
  usage: "add transaction",
  validate: (args: string[]) => {
    if (args.length < 1 || args[0] !== "transaction") {
      return { valid: false, error: "Usage: add transaction" };
    }
    return { valid: true };
  },
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    if (args[0] === "transaction") {
      context.logger.addLog("success", "Transaction template added to editor");

      const template = `\n\n${
        typeof window !== "undefined"
          ? new Date().toISOString().split("T")[0].replace(/-/g, "/")
          : "2024/01/18"
      } * Description
    Account:Name                 $0.00
    Assets:Checking`;

      context.editor.setLedgerContent(context.editor.ledgerContent + template);
      context.editor.setIsModified(true);

      context.updateMessage(
        "Transaction template added! Switch to editor to fill in details.",
        "success"
      );

      return {
        success: true,
        message:
          "Transaction template added! Switch to editor to fill in details.",
      };
    } else {
      context.logger.addLog("warning", "Usage: add transaction");
      context.updateMessage("Try: add transaction", "warning");

      return {
        success: false,
        message: "Usage: add transaction",
      };
    }
  },
};
