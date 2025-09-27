import type { Command, CommandContext, CommandResult } from "../../types";
import { loadRules } from "../../natural-language/rules-engine";

interface ParsedTransaction {
  date: string;
  description: string;
  accounts: Array<{
    account: string;
    amount: string;
  }>;
}

function parseTransactions(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = content.split("\n");

  let currentTransaction: ParsedTransaction | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(";")) {
      continue;
    }

    // Check if this is a transaction header (date + description)
    const transactionMatch = trimmed.match(
      /^(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+(.+)$/
    );
    if (transactionMatch) {
      // Save previous transaction if exists
      if (currentTransaction) {
        transactions.push(currentTransaction);
      }

      // Start new transaction
      currentTransaction = {
        date: transactionMatch[1],
        description: transactionMatch[2],
        accounts: [],
      };
      continue;
    }

    // Check if this is an account line (starts with spaces and has account + amount)
    // Updated regex to handle multiple spaces between account and amount
    const accountMatch = trimmed.match(
      /^(.+)\s+([+-]?\d+\.?\d*)\s+([A-Z]{3})\s*$/
    );
    if (accountMatch && currentTransaction) {
      const [, account, amount, currency] = accountMatch;
      currentTransaction.accounts.push({
        account: account.trim(),
        amount: `${amount} ${currency}`,
      });
    }
  }

  // Add the last transaction if exists
  if (currentTransaction) {
    transactions.push(currentTransaction);
  }
  return transactions;
}

interface AccountBalance {
  account: string;
  balance: number;
  currency: string;
}

function calculateBalances(
  transactions: ParsedTransaction[]
): AccountBalance[] {
  const balances = new Map<string, { balance: number; currency: string }>();

  for (const transaction of transactions) {
    for (const accountEntry of transaction.accounts) {
      const account = accountEntry.account;
      const amountStr = accountEntry.amount.replace(/[$,]/g, "");
      const parts = amountStr.split(" ");
      const amount = parseFloat(parts[0]) || 0;
      const currency = parts[1] || "USD";

      if (!balances.has(account)) {
        balances.set(account, { balance: 0, currency });
      }

      const current = balances.get(account)!;
      current.balance += amount;
    }
  }

  return Array.from(balances.entries()).map(([account, data]) => ({
    account,
    balance: data.balance,
    currency: data.currency,
  }));
}

function filterBalancesByPattern(
  balances: AccountBalance[],
  pattern: string
): AccountBalance[] {
  if (!pattern) {
    return balances;
  }

  // Convert pattern to regex
  // Replace * with .* for wildcard matching
  // Replace : with \: to escape colons
  const regexPattern = pattern
    .replace(/\*/g, ".*")
    .replace(/:/g, "\\:")
    .toLowerCase();

  const regex = new RegExp(`^${regexPattern}$`, "i");

  return balances.filter((balance) => {
    const accountName = balance.account.toLowerCase();
    return regex.test(accountName);
  });
}

export const balanceCommand: Command = {
  name: "balance",
  aliases: ["bal"],
  description: "Show account balances",
  usage: "balance [account-pattern]",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    // Add loading message
    const loadingLogId = Date.now().toString();
    context.logger.addLog(
      "loading",
      "🔍 Gathering data from GitHub repository..."
    );

    try {
      if (!context.repository) {
        context.logger.addLog("error", "❌ No repository connected");
        return {
          success: false,
          message:
            "No repository connected. Please connect to a GitHub repository first.",
        };
      }

      // Group files by type for processing
      const journals = context.repositoryItems.filter(
        (item) =>
          item.path.startsWith("journals/") && item.path.endsWith(".journal")
      );

      // Load rules and accounts (needed for processing)
      const { rules, accounts } = await loadRules({
        owner: context.repository.owner,
        repo: context.repository.repo,
      });

      // Collect all transactions from all journal files
      const allTransactions: ParsedTransaction[] = [];

      for (const journal of journals) {
        try {
          // Load the journal file directly from GitHub API
          const response = await fetch(
            `/api/github/files?owner=${context.repository.owner}&repo=${
              context.repository.repo
            }&path=${encodeURIComponent(journal.path)}`
          );

          if (response.ok) {
            const data = await response.json();
            const transactions = parseTransactions(data.content);
            allTransactions.push(...transactions);
          }
        } catch (error) {
          // Silently continue on error
        }
      }

      // Calculate balances
      const balances = calculateBalances(allTransactions);

      // Remove loading message
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );

      // Filter balances based on account pattern if provided
      let filteredBalances = balances;
      if (args.length > 0) {
        const pattern = args[0];
        filteredBalances = filterBalancesByPattern(balances, pattern);
      }

      // Show calculated balances in app terminal
      if (args.length > 0) {
        context.logger.addLog("success", `💰 Account Balances (${args[0]}):`);
      } else {
        context.logger.addLog("success", "💰 Account Balances:");
      }

      if (filteredBalances.length > 0) {
        // Sort balances by account name
        filteredBalances.sort((a, b) => a.account.localeCompare(b.account));

        filteredBalances.forEach((balance) => {
          const sign = balance.balance >= 0 ? "" : "-";
          context.logger.addLog(
            "info",
            `  ${balance.account.padEnd(30)} ${sign}$${Math.abs(
              balance.balance
            ).toFixed(2)} ${balance.currency}`
          );
        });

        // Calculate balance check
        const totalBalance = filteredBalances.reduce(
          (sum, balance) => sum + balance.balance,
          0
        );
        context.logger.addLog("info", "");
        context.logger.addLog(
          "info",
          `  ${"Balance check".padEnd(30)} ${
            totalBalance >= 0 ? "" : "-"
          }$${Math.abs(totalBalance).toFixed(2)}`
        );
      } else {
        if (args.length > 0) {
          context.logger.addLog(
            "warning",
            `  No accounts found matching pattern: ${args[0]}`
          );
          context.logger.addLog(
            "info",
            "  💡 Try a different pattern or use 'accounts' to see all available accounts"
          );
        } else {
          context.logger.addLog(
            "warning",
            "  No transactions found to calculate balances"
          );
          context.logger.addLog(
            "info",
            "  💡 Try adding some transactions first, or check if journal files contain valid ledger entries"
          );
        }
      }

      context.updateMessage(
        "Account balances displayed successfully",
        "success"
      );

      return {
        success: true,
        message: "Account balances displayed successfully",
      };
    } catch (error) {
      // Remove loading message
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );

      context.logger.addLog(
        "error",
        "Error gathering data for balance command"
      );
      context.updateMessage(
        "Error gathering data for balance command",
        "error"
      );

      return {
        success: false,
        message: `Error gathering data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },
};
