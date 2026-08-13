import { formatCommandLine } from "@/lib/ledger/commands/format";
import { collectKnownPayees, normalizeCommandFilters } from "@/lib/ledger/commands/filters";
import type {
  CommandFilters,
  CommandName,
  ResolveCommandResult,
} from "@/lib/ledger/commands/types";
import type { LedgerAccount, LedgerEntryRecord, LedgerSummary } from "@/lib/ledger/types";
import { DEFAULT_OPENAI_MODEL, createOpenAIClient } from "@/lib/openai";

type RouteJournalCommandParams = {
  accounts: LedgerAccount[];
  entries: LedgerEntryRecord[];
  ledger: LedgerSummary;
  prompt: string;
};

type RoutedCommand = {
  command: CommandName;
  filters: CommandFilters;
};

export async function routeJournalCommand({
  accounts,
  entries,
  ledger,
  prompt,
}: RouteJournalCommandParams): Promise<ResolveCommandResult> {
  const client = createOpenAIClient();
  const today = new Date().toISOString().slice(0, 10);
  const knownPayees = collectKnownPayees(entries);
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "You route natural-language journal requests to explicit ledger commands.",
          "Choose register when the user wants to list, show, find, or filter entries.",
          "Choose sum when the user asks how much, total spent, total paid, or amount over a period.",
          "Choose balance when the user asks for account balances or what an account total is.",
          "Choose accounts when the user asks to list accounts or chart of accounts.",
          "Choose help when the user asks what commands are available.",
          "Use payee for person or vendor names such as Tee or Charty. Payee matches vendor and description partially.",
          "Use vendorName only when the user clearly means the stored vendor field.",
          "When the user says expenses or spending, set accountCategory to expense.",
          "When the user names an expense category like software, use searchText or accountName if an exact account exists.",
          "Use only supplied account names for accountName.",
          "If a filter is not clearly specified, return null for that field.",
          `Known payees in this ledger: ${knownPayees.join(", ") || "none yet"}.`,
          `Use ${today} as the reference date for relative periods like 'last month' or 'August'.`,
          "Amount thresholds should be positive numbers.",
          "Return JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          availableAccounts: accounts.map((account) => account.name),
          defaultCurrency: ledger.defaultCurrency,
          knownPayees,
          ledgerName: ledger.name,
          prompt,
          today,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "journal_command_route",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            command: {
              type: "string",
              enum: ["register", "sum", "balance", "accounts", "help"],
            },
            filters: {
              type: "object",
              additionalProperties: false,
              properties: {
                accountCategory: {
                  type: ["string", "null"],
                  enum: ["asset", "liability", "equity", "income", "expense", null],
                },
                accountName: { type: ["string", "null"] },
                endDate: { type: ["string", "null"] },
                maxAmount: { type: ["number", "null"] },
                minAmount: { type: ["number", "null"] },
                payee: { type: ["string", "null"] },
                searchText: { type: ["string", "null"] },
                startDate: { type: ["string", "null"] },
                vendorName: { type: ["string", "null"] },
              },
              required: [
                "accountCategory",
                "accountName",
                "endDate",
                "maxAmount",
                "minAmount",
                "payee",
                "searchText",
                "startDate",
                "vendorName",
              ],
            },
          },
          required: ["command", "filters"],
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("OpenAI did not return a routed journal command.");
  }

  const parsed = JSON.parse(rawContent) as RoutedCommand;
  const filters = normalizeCommandFilters(parsed.filters, accounts);

  return {
    commandLine: formatCommandLine(parsed.command, filters),
    filters,
    name: parsed.command,
    routedBy: "natural-language",
  };
}
