import type { CommandFilters, CommandName, ParsedCommand } from "@/lib/ledger/commands/types";
import type { AccountCategory } from "@/lib/ledger/types";

const COMMAND_NAMES: CommandName[] = [
  "register",
  "sum",
  "balance",
  "accounts",
  "help",
];

const COMMAND_ALIASES: Record<string, CommandName> = {
  accounts: "accounts",
  accts: "accounts",
  bal: "balance",
  balance: "balance",
  help: "help",
  list: "register",
  reg: "register",
  register: "register",
  show: "register",
  sum: "sum",
  total: "sum",
  totals: "sum",
};

const FLAG_MAP: Record<string, keyof CommandFilters> = {
  "-a": "accountName",
  "--account": "accountName",
  "--category": "accountCategory",
  "--end": "endDate",
  "--from": "startDate",
  "--max": "maxAmount",
  "--min": "minAmount",
  "--payee": "payee",
  "-s": "searchText",
  "--search": "searchText",
  "--start": "startDate",
  "--to": "endDate",
  "--vendor": "vendorName",
};

const CATEGORY_KEYWORDS: Record<string, AccountCategory> = {
  asset: "asset",
  assets: "asset",
  equity: "equity",
  expense: "expense",
  expenses: "expense",
  income: "income",
  liability: "liability",
  liabilities: "liability",
};

function isCommandName(value: string): value is CommandName {
  return COMMAND_NAMES.includes(value as CommandName);
}

function tokenize(input: string) {
  const tokens: string[] = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(\S+)/g;

  for (const match of input.matchAll(pattern)) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
  }

  return tokens;
}

function emptyFilters(): CommandFilters {
  return {
    accountCategory: null,
    accountName: null,
    endDate: null,
    maxAmount: null,
    minAmount: null,
    payee: null,
    searchText: null,
    startDate: null,
    vendorName: null,
  };
}

function parseFilterValue(
  key: keyof CommandFilters,
  value: string | undefined,
): string | number | AccountCategory | null {
  if (!value) {
    return null;
  }

  if (key === "minAmount" || key === "maxAmount") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.abs(parsed) : null;
  }

  if (key === "accountCategory") {
    return CATEGORY_KEYWORDS[value.toLowerCase()] ?? null;
  }

  return value;
}

function applyPositionalTokens(args: CommandFilters, tokens: string[]) {
  const payeeParts: string[] = [];

  for (const token of tokens) {
    const category = CATEGORY_KEYWORDS[token.toLowerCase()];

    if (category) {
      args.accountCategory = category;
      continue;
    }

    payeeParts.push(token);
  }

  if (payeeParts.length > 0 && !args.payee && !args.vendorName && !args.searchText) {
    args.payee = payeeParts.join(" ");
  }
}

export function looksLikeExplicitCommand(input: string) {
  const trimmed = input.trim().replace(/^[/>]\s*/, "");
  const firstToken = tokenize(trimmed)[0]?.toLowerCase();

  return Boolean(firstToken && COMMAND_ALIASES[firstToken]);
}

export function parseExplicitCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim().replace(/^[/>]\s*/, "");

  if (!trimmed) {
    return null;
  }

  const tokens = tokenize(trimmed);
  const commandToken = tokens[0]?.toLowerCase();
  const name = commandToken ? COMMAND_ALIASES[commandToken] : undefined;

  if (!name || !isCommandName(name)) {
    return null;
  }

  const args = emptyFilters();
  const positional: string[] = [];

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    const mappedKey = FLAG_MAP[token];

    if (!mappedKey) {
      positional.push(token);
      continue;
    }

    const value = tokens[index + 1];
    const parsedValue = parseFilterValue(mappedKey, value);

    if (parsedValue !== null) {
      args[mappedKey] = parsedValue as never;
      index += 1;
    }
  }

  applyPositionalTokens(args, positional);

  return { args, name };
}

export function getHelpText() {
  return [
    "Journal commands",
    "",
    "register [--account NAME] [--category expense|income|asset|liability|equity]",
    "         [--payee NAME] [--vendor NAME] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--search TEXT]",
    "  List matching journal entries.",
    "",
    "sum [--account NAME] [--category expense|income|asset|liability|equity]",
    "    [--payee NAME] [--vendor NAME] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--search TEXT]",
    "  Total matching amounts. With --category expense, sums expense postings only.",
    "",
    "  Shorthand: sum charty",
    "             sum expenses charty",
    "",
    "balance [--account NAME] [--from YYYY-MM-DD] [--to YYYY-MM-DD]",
    "  Show net balances by account.",
    "",
    "accounts",
    "  List chart of accounts for the selected ledger.",
    "",
    "help",
    "  Show this help text.",
    "",
    "Payee matching:",
    "  --payee matches vendor name or description (partial, case-insensitive).",
    "  Example: --payee charty matches 'Charty - handyman'.",
    "",
    "Natural language is also supported, for example:",
    '  "show Tee entries in August"',
    '  "how much did I spend on Charty?"',
    '  "sum expenses for charty"',
  ].join("\n");
}
