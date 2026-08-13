import type {
  JournalQueryFilters,
  LedgerAccount,
  LedgerEntryRecord,
  LedgerSummary,
} from "@/lib/ledger/types";

export type CommandName = "register" | "sum" | "balance" | "accounts" | "help";

export type CommandFilters = JournalQueryFilters;

export type ParsedCommand = {
  args: CommandFilters;
  name: CommandName;
};

export type AccountBalanceRow = {
  account: string;
  amount: number;
  currency: string;
};

export type CommandExecutionResult = {
  accounts?: LedgerAccount[];
  balances?: AccountBalanceRow[];
  commandLine: string;
  entries?: LedgerEntryRecord[];
  filters: CommandFilters;
  helpText?: string;
  ledger: LedgerSummary;
  name: CommandName;
  total?: {
    amount: number;
    currency: string;
    entryCount: number;
  };
};

export type ResolveCommandResult = {
  commandLine: string;
  filters: CommandFilters;
  name: CommandName;
  routedBy: "explicit" | "natural-language";
};
