import { formatCommandLine } from "@/lib/ledger/commands/format";
import {
  collectKnownPayees,
  entriesForBalance,
  filterLedgerEntries,
  normalizeCommandFilters,
  sumEntryAmount,
} from "@/lib/ledger/commands/filters";
import { getHelpText, parseExplicitCommand } from "@/lib/ledger/commands/parser";
import { routeJournalCommand } from "@/lib/ledger/commands/router";
import type {
  AccountBalanceRow,
  CommandExecutionResult,
  ResolveCommandResult,
} from "@/lib/ledger/commands/types";
import type {
  LedgerAccount,
  LedgerEntryRecord,
  LedgerSummary,
} from "@/lib/ledger/types";

type ExecuteJournalCommandParams = {
  accounts: LedgerAccount[];
  entries: LedgerEntryRecord[];
  input: string;
  ledger: LedgerSummary;
};

function computeBalances(
  entries: LedgerEntryRecord[],
  currency: string,
  accountName?: string | null,
): AccountBalanceRow[] {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    for (const posting of entry.postings) {
      if (accountName && posting.account !== accountName) {
        continue;
      }

      totals.set(posting.account, (totals.get(posting.account) ?? 0) + posting.amount);
    }
  }

  return [...totals.entries()]
    .map(([account, amount]) => ({
      account,
      amount,
      currency,
    }))
    .sort((left, right) => left.account.localeCompare(right.account));
}

export async function resolveJournalCommand({
  accounts,
  entries,
  input,
  ledger,
}: ExecuteJournalCommandParams): Promise<ResolveCommandResult> {
  const explicit = parseExplicitCommand(input);

  if (explicit) {
    const filters = normalizeCommandFilters(explicit.args, accounts);

    return {
      commandLine: formatCommandLine(explicit.name, filters),
      filters,
      name: explicit.name,
      routedBy: "explicit",
    };
  }

  return routeJournalCommand({
    accounts,
    entries,
    ledger,
    prompt: input,
  });
}

export async function executeJournalCommand({
  accounts,
  entries,
  input,
  ledger,
}: ExecuteJournalCommandParams): Promise<CommandExecutionResult> {
  const resolved = await resolveJournalCommand({
    accounts,
    entries,
    input,
    ledger,
  });
  const filteredEntries = filterLedgerEntries(entries, resolved.filters, accounts);
  const balanceEntries = filterLedgerEntries(
    entriesForBalance(entries),
    resolved.filters,
    accounts,
  );

  if (resolved.name === "help") {
    return {
      commandLine: resolved.commandLine,
      filters: resolved.filters,
      helpText: getHelpText(),
      ledger,
      name: resolved.name,
    };
  }

  if (resolved.name === "accounts") {
    return {
      accounts,
      commandLine: resolved.commandLine,
      filters: resolved.filters,
      ledger,
      name: resolved.name,
    };
  }

  if (resolved.name === "balance") {
    return {
      balances: computeBalances(
        balanceEntries,
        ledger.defaultCurrency,
        resolved.filters.accountName,
      ),
      commandLine: resolved.commandLine,
      filters: resolved.filters,
      ledger,
      name: resolved.name,
    };
  }

  if (resolved.name === "sum") {
    const amount = filteredEntries.reduce(
      (total, entry) => total + sumEntryAmount(entry, resolved.filters, accounts),
      0,
    );

    return {
      commandLine: resolved.commandLine,
      entries: filteredEntries,
      filters: resolved.filters,
      ledger,
      name: resolved.name,
      total: {
        amount,
        currency: ledger.defaultCurrency,
        entryCount: filteredEntries.length,
      },
    };
  }

  return {
    commandLine: resolved.commandLine,
    entries: filteredEntries,
    filters: resolved.filters,
    ledger,
    name: resolved.name,
  };
}

export { collectKnownPayees };
