import { formatCommandLine } from "@/lib/ledger/commands/format";
import {
  collectKnownPayees,
  entriesForActiveTotals,
  entriesForBalance,
  filterLedgerEntries,
  normalizeCommandFilters,
  sumEntryAmount,
} from "@/lib/ledger/commands/filters";
import { augmentFiltersFromPrompt } from "@/lib/ledger/commands/nl-augment";
import { getHelpText, parseExplicitCommand } from "@/lib/ledger/commands/parser";
import { routeJournalCommand } from "@/lib/ledger/commands/router";
import type {
  AccountBalanceRow,
  CommandExecutionResult,
  CommandFilters,
  CommandName,
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

function finalizeResolvedCommand(
  input: string,
  name: CommandName,
  filters: CommandFilters,
  accounts: LedgerAccount[],
  routedBy: ResolveCommandResult["routedBy"],
): ResolveCommandResult {
  const augmented = augmentFiltersFromPrompt(input, name, filters);
  const normalized = normalizeCommandFilters(augmented, accounts);

  return {
    commandLine: formatCommandLine(name, normalized),
    filters: normalized,
    name,
    routedBy,
  };
}

export async function resolveJournalCommand({
  accounts,
  entries,
  input,
  ledger,
}: ExecuteJournalCommandParams): Promise<ResolveCommandResult> {
  const explicit = parseExplicitCommand(input);

  if (explicit) {
    return finalizeResolvedCommand(
      input,
      explicit.name,
      explicit.args,
      accounts,
      "explicit",
    );
  }

  const routed = await routeJournalCommand({
    accounts,
    entries,
    ledger,
    prompt: input,
  });

  return finalizeResolvedCommand(
    input,
    routed.name,
    routed.filters,
    accounts,
    routed.routedBy,
  );
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
  const activeEntries = entriesForActiveTotals(entries);
  const filteredEntries = filterLedgerEntries(activeEntries, resolved.filters, accounts);
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
