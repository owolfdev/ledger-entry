/**
 * Add command for natural language transaction entry
 */

import type { Command, CommandContext, CommandResult } from "../../types";
import { parseAddCommand } from "../../natural-language/parser";
import {
  loadRules,
  applyRules,
  generateLedgerEntry,
} from "../../natural-language/rules-engine";

export const addCommand: Command = {
  name: "add",
  description: "Add a transaction using natural language",
  usage:
    "add <item> <amount> [currency] [, <item> <amount>] [@|at <merchant>] [with <payment>] [for <entity>] [on <date>] [memo <comment>]",
  examples: [
    "add coffee 10",
    "add coffee 10 @ Starbucks",
    "add coffee 10 @ Starbucks with kbank",
    "add coffee 10, croissant 5 @ Starbucks",
    'add coffee 10 @ Starbucks memo "morning coffee"',
    "add lunch 25 @ McDonald's with visa for Personal on today",
  ],

  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    // Check if we have repository info
    if (!context.repository) {
      return {
        success: false,
        message: "No repository selected. Please select a repository first.",
      };
    }

    // Join args to get the full command text
    const commandText = args.join(" ");

    if (!commandText.trim()) {
      return {
        success: false,
        message:
          "Please specify what to add. Example: add coffee 10 @ Starbucks",
      };
    }

    try {
      // Add loading message
      const loadingLogId = Date.now().toString();
      context.logger.addLog(
        "loading",
        "🧠 Parsing natural language command..."
      );

      // Parse the natural language command
      const parseResult = parseAddCommand(`add ${commandText}`);

      if (!parseResult.success) {
        context.logger.setLogs(
          context.logger.logs.filter((log) => log.id !== loadingLogId)
        );
        return {
          success: false,
          message: `Parse error: ${parseResult.error.message}`,
          details: parseResult.error.suggestion,
        };
      }

      context.logger.addLog(
        "info",
        "   → Loading rules and accounts from repository..."
      );

      // Load rules and accounts from GitHub
      const { rules, accounts } = await loadRules({
        owner: context.repository.owner,
        repo: context.repository.repo,
      });

      context.logger.addLog(
        "info",
        `   → Loaded ${rules.items.length} item rules, ${rules.merchants.length} merchant rules, ${rules.payments.length} payment rules`
      );
      context.logger.addLog("info", `   → Loaded ${accounts.length} accounts`);

      // Apply rules to map natural language to accounts
      context.logger.addLog(
        "info",
        "   → Applying rules to map items to accounts..."
      );

      const appliedRules = applyRules(parseResult.data, { ...rules, accounts });

      context.logger.addLog(
        "info",
        `   → Mapped to entity: ${appliedRules.entity}, currency: ${appliedRules.currency}`
      );
      context.logger.addLog(
        "info",
        `   → Debit accounts: ${appliedRules.debitAccounts
          .map(
            (item: {
              account: string;
              amount: number;
              currency: string;
              itemName: string;
            }) => `${item.account} (${item.amount} ${item.currency})`
          )
          .join(", ")}`
      );
      context.logger.addLog(
        "info",
        `   → Credit account: ${appliedRules.creditAccount}`
      );

      // Generate Ledger entry
      context.logger.addLog("info", "   → Generating Ledger entry...");

      const ledgerEntry = generateLedgerEntry(parseResult.data, appliedRules);

      // Remove loading messages
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );

      // Populate the terminal input with the generated entry
      context.logger.addLog(
        "success",
        "✅ Generated Ledger entry and populated terminal input"
      );

      // Populate the terminal input field with the generated entry
      if (context.setCommand) {
        context.setCommand(ledgerEntry);
      }

      context.logger.addLog(
        "info",
        "💡 Edit the entry in the input field if needed, then press Enter to save it to your repository."
      );

      // Store the generated entry in the command context for potential use
      // The user will manually copy/edit this and press Enter to save

      return {
        success: true,
        message:
          "Natural language command parsed successfully. Generated entry shown above.",
        data: {
          generatedEntry: ledgerEntry,
          parsedCommand: parseResult.data,
          appliedRules: appliedRules,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process add command";

      // Remove any loading messages
      context.logger.setLogs(
        context.logger.logs.filter(
          (log) => !log.message.includes("Parsing natural language")
        )
      );

      context.logger.addLog(
        "error",
        `❌ Failed to process add command: ${errorMessage}`
      );

      return {
        success: false,
        message: `Failed to process add command: ${errorMessage}`,
      };
    }
  },
};
