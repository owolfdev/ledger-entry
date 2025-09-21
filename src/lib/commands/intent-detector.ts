/**
 * Intent detection system to distinguish between commands and ledger entries
 */

export interface ParsedLedgerEntry {
  date: string;
  description: string;
  yearMonth: string; // YYYY-MM format
  fullContent: string;
}

export interface IntentDetectionResult {
  isCommand: boolean;
  isLedgerEntry: boolean;
  ledgerEntry?: ParsedLedgerEntry;
}

/**
 * Detects if input is a known command
 */
function isKnownCommand(input: string): boolean {
  const command = input.trim().split(" ")[0].toLowerCase();
  const knownCommands = [
    "help",
    "clear",
    "validate",
    "balance",
    "bal",
    "accounts",
    "files",
    "journals",
    "rules",
    "load",
    "save",
    "add",
  ];
  return knownCommands.includes(command);
}

/**
 * Parses a ledger entry and extracts date information
 */
function parseLedgerEntry(input: string): ParsedLedgerEntry | null {
  const lines = input.trim().split("\n");
  if (lines.length < 2) return null;

  const firstLine = lines[0].trim();

  // Check if first line starts with a date (YYYY/MM/DD or YYYY-MM-DD format)
  // Must be zero-padded: YYYY/MM/DD (e.g., 2025/02/15, not 2025/2/15)
  const dateMatch = firstLine.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (!dateMatch) return null;

  const [, year, month, day] = dateMatch;

  // Validate date components
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);

  if (yearNum < 1900 || yearNum > 2100) return null;
  if (monthNum < 1 || monthNum > 12) return null;
  if (dayNum < 1 || dayNum > 31) return null;

  // Extract description (everything after the date on the first line)
  const description = firstLine.replace(dateMatch[0], "").trim();

  // Check if there are account lines (should start with spaces and contain amounts)
  const accountLines = lines.slice(1).filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      (line.startsWith("    ") || line.startsWith("\t")) &&
      /\$?\d+/.test(trimmed)
    ); // Contains amounts
  });

  if (accountLines.length === 0) return null;

  // Format year-month as YYYY-MM
  const yearMonth = `${year}-${month.padStart(2, "0")}`;

  return {
    date: `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`,
    description,
    yearMonth,
    fullContent: input.trim(),
  };
}

/**
 * Main intent detection function
 */
export function detectIntent(input: string): IntentDetectionResult {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return { isCommand: false, isLedgerEntry: false };
  }

  // First check if it's a known command
  if (isKnownCommand(trimmedInput)) {
    return { isCommand: true, isLedgerEntry: false };
  }

  // Try to parse as ledger entry
  const ledgerEntry = parseLedgerEntry(trimmedInput);
  if (ledgerEntry) {
    return {
      isCommand: false,
      isLedgerEntry: true,
      ledgerEntry,
    };
  }

  // Neither command nor valid ledger entry
  return { isCommand: false, isLedgerEntry: false };
}
