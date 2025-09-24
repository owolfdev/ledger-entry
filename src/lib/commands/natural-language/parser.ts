/**
 * Natural Language Parser for the 'add' command
 * Parses structured input like: add coffee 10 @ Starbucks with kbank
 */

export interface ParsedAddCommand {
  items: ParsedItem[];
  merchant?: string;
  payment?: string;
  entity?: string;
  date?: string;
  memo?: string;
  currency?: string;
}

export interface ParsedItem {
  name: string;
  amount: number;
  currency?: string;
}

export interface ParseError {
  message: string;
  suggestion?: string;
}

/**
 * Parse a natural language 'add' command
 */
export function parseAddCommand(
  input: string
):
  | { success: true; data: ParsedAddCommand }
  | { success: false; error: ParseError } {
  const trimmed = input.trim();

  // Must start with 'add'
  if (!trimmed.toLowerCase().startsWith("add ")) {
    return {
      success: false,
      error: {
        message: "Command must start with 'add'",
        suggestion: "Try: add coffee 10 @ Starbucks",
      },
    };
  }

  const commandText = trimmed.substring(4).trim(); // Remove 'add ' prefix

  if (!commandText) {
    return {
      success: false,
      error: {
        message: "No items specified after 'add'",
        suggestion: "Try: add coffee 10",
      },
    };
  }

  try {
    const parsed = parseCommandText(commandText);
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Failed to parse command",
        suggestion: "Try: add coffee 10 @ Starbucks",
      },
    };
  }
}

/**
 * Parse the command text after 'add'
 */
function parseCommandText(text: string): ParsedAddCommand {
  const result: ParsedAddCommand = {
    items: [],
  };

  // Parse different components
  let remaining = text;

  // Extract memo first (it's at the end)
  const memoMatch = remaining.match(/\bmemo\s+["']([^"']+)["']/i);
  if (memoMatch) {
    result.memo = memoMatch[1];
    remaining = remaining.replace(memoMatch[0], "").trim();
  }

  // Extract date
  const dateMatch = remaining.match(
    /\bon\s+(today|yesterday|tomorrow|\d{4}[\/\-]\d{2}[\/\-]\d{2})/i
  );
  if (dateMatch) {
    result.date = normalizeDate(dateMatch[1]);
    remaining = remaining.replace(dateMatch[0], "").trim();
  }

  // Extract entity
  const entityMatch = remaining.match(/\bfor\s+([a-zA-Z0-9_]+)/i);
  if (entityMatch) {
    result.entity = entityMatch[1];
    remaining = remaining.replace(entityMatch[0], "").trim();
  }

  // Extract payment method
  const paymentMatch = remaining.match(/\bwith\s+([a-zA-Z0-9_]+)/i);
  if (paymentMatch) {
    result.payment = paymentMatch[1];
    remaining = remaining.replace(paymentMatch[0], "").trim();
  }

  // Extract merchant
  const merchantMatch = remaining.match(
    /(?:@|at)\s+([^,]+?)(?:\s+with|\s+for|\s+on|\s+memo|$)/i
  );
  if (merchantMatch) {
    result.merchant = merchantMatch[1].trim();
    remaining = remaining.replace(merchantMatch[0], "").trim();
  }

  // Parse items (what's left)
  const items = parseItems(remaining);
  if (items.length === 0) {
    throw new Error(
      `No valid items found. Each item must include a name and amount (e.g., "coffee 10" or "coffee 10 THB"). Remaining text: "${remaining}"`
    );
  }

  result.items = items;

  // Extract currency from items if not specified globally
  const currencies = items
    .filter((item) => item.currency)
    .map((item) => item.currency);
  if (currencies.length > 0) {
    result.currency = currencies[0]; // Use first currency found
  }

  return result;
}

/**
 * Parse items from the remaining text
 */
function parseItems(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  // Split by commas for multiple items
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (const part of parts) {
    const item = parseSingleItem(part);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Parse a single item: "coffee 10 THB" or "coffee 10"
 */
function parseSingleItem(text: string): ParsedItem | null {
  // Match: item_name amount [currency]
  const match = text.match(
    /^([a-zA-Z0-9_\s]+?)\s+(\d+(?:\.\d{1,2})?)\s*([A-Z]{3})?$/
  );

  if (!match) {
    return null;
  }

  const [, name, amountStr, currency] = match;
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  return {
    name: name.trim(),
    amount,
    currency: currency || undefined,
  };
}

/**
 * Normalize date strings
 */
function normalizeDate(dateStr: string): string {
  const today = new Date();

  switch (dateStr.toLowerCase()) {
    case "today":
      return formatDate(today);
    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return formatDate(yesterday);
    case "tomorrow":
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return formatDate(tomorrow);
    default:
      // Assume it's a date string like 2025/01/15 or 2025-01-15
      return dateStr.replace(/[\/\-]/g, "/");
  }
}

/**
 * Format date as YYYY/MM/DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

/**
 * Test function to validate parsing
 */
export function testParser() {
  const testCases = [
    "add coffee 10",
    "add coffee 10 @ Starbucks",
    "add coffee 10 @ Starbucks with kbank",
    "add coffee 10, croissant 5 @ Starbucks",
    'add coffee 10 THB @ Starbucks with kbank for Personal on today memo "morning coffee"',
    'add lunch 25 @ McDonald\'s with visa memo "client lunch"',
    "add gas 50 @ Shell with cash",
  ];

  console.log("Testing Natural Language Parser:");
  for (const test of testCases) {
    const result = parseAddCommand(test);
    console.log(`Input: "${test}"`);
    if (result.success) {
      console.log("✓ Success:", JSON.stringify(result.data, null, 2));
    } else {
      console.log("✗ Error:", result.error.message);
    }
    console.log("---");
  }
}
