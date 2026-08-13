import type { CommandFilters, CommandName, ParsedCommand } from "@/lib/ledger/commands/types";

function formatFilterFlags(filters: CommandFilters) {
  const parts: string[] = [];

  if (filters.accountName) {
    parts.push(`--account ${quoteArg(filters.accountName)}`);
  }
  if (filters.startDate) {
    parts.push(`--from ${filters.startDate}`);
  }
  if (filters.endDate) {
    parts.push(`--to ${filters.endDate}`);
  }
  if (filters.accountCategory) {
    parts.push(`--category ${filters.accountCategory}`);
  }
  if (filters.payee) {
    parts.push(`--payee ${quoteArg(filters.payee)}`);
  }
  if (filters.vendorName) {
    parts.push(`--vendor ${quoteArg(filters.vendorName)}`);
  }
  if (filters.searchText) {
    parts.push(`--search ${quoteArg(filters.searchText)}`);
  }
  if (filters.minAmount) {
    parts.push(`--min ${filters.minAmount}`);
  }
  if (filters.maxAmount) {
    parts.push(`--max ${filters.maxAmount}`);
  }

  return parts;
}

function quoteArg(value: string) {
  return /\s/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

export function formatCommandLine(name: CommandName, filters: CommandFilters) {
  const flags = formatFilterFlags(filters);
  return flags.length > 0 ? `${name} ${flags.join(" ")}` : name;
}

export function formatParsedCommand(command: ParsedCommand) {
  return formatCommandLine(command.name, command.args);
}
