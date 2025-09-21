/**
 * Ledger entry validation system
 */

import type { ParsedLedgerEntry } from "./intent-detector";

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  type: "date-range" | "future-date";
  message: string;
  field?: string;
}

export interface ValidationError {
  type: "invalid-date" | "missing-amount" | "unbalanced" | "invalid-structure";
  message: string;
  field?: string;
  suggestion?: string;
}

export interface TransactionLine {
  account: string;
  amount: string;
  isDebit: boolean;
  numericAmount: number;
}

/**
 * Validate a parsed ledger entry
 */
export function validateLedgerEntry(
  entry: ParsedLedgerEntry
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  // 1. Validate the date
  const dateValidation = validateDate(entry.date);
  if (!dateValidation.isValid) {
    result.isValid = false;
    result.errors.push(...dateValidation.errors);
  }
  if (dateValidation.warnings.length > 0) {
    result.warnings.push(...dateValidation.warnings);
  }

  // 2. Validate transaction structure
  const structureValidation = validateTransactionStructure(entry.fullContent);
  if (!structureValidation.isValid) {
    result.isValid = false;
    result.errors.push(...structureValidation.errors);
  }

  // 3. Validate transaction balance
  const balanceValidation = validateTransactionBalance(entry.fullContent);
  if (!balanceValidation.isValid) {
    result.isValid = false;
    result.errors.push(...balanceValidation.errors);
  }

  return result;
}

/**
 * Validate date format and range
 */
function validateDate(dateString: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  // Parse the date (format: YYYY/MM/DD with zero-padding)
  const dateMatch = dateString.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!dateMatch) {
    result.isValid = false;
    result.errors.push({
      type: "invalid-date",
      message: "Invalid date format. Expected YYYY/MM/DD with zero-padding",
      field: "date",
      suggestion: "Use format like 2025/09/15 (not 2025/9/15 or 2025/09/5)",
    });
    return result;
  }

  const [, yearStr, monthStr, dayStr] = dateMatch;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);

  // Validate year range
  if (year < 1900 || year > 2100) {
    result.isValid = false;
    result.errors.push({
      type: "invalid-date",
      message: "Year must be between 1900 and 2100",
      field: "date",
    });
    return result;
  }

  // Validate month
  if (month < 1 || month > 12) {
    result.isValid = false;
    result.errors.push({
      type: "invalid-date",
      message: `Invalid month: ${month}. Month must be between 01 and 12`,
      field: "date",
      suggestion: "Use months 01-12 (January = 01, December = 12)",
    });
    return result;
  }

  // Validate day
  if (day < 1 || day > 31) {
    result.isValid = false;
    result.errors.push({
      type: "invalid-date",
      message: `Invalid day: ${day}. Day must be between 01 and 31`,
      field: "date",
      suggestion: "Use days 01-31",
    });
    return result;
  }

  // Check if the date actually exists (e.g., Feb 30, Apr 31)
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    result.isValid = false;
    result.errors.push({
      type: "invalid-date",
      message: `Invalid date: ${dateString} does not exist`,
      field: "date",
      suggestion:
        "Check that the day exists for the given month (e.g., no Feb 30)",
    });
    return result;
  }

  // Check for date range warnings
  const currentYear = new Date().getFullYear();
  const yearDifference = Math.abs(year - currentYear);

  if (yearDifference > 2) {
    result.warnings.push({
      type: "date-range",
      message: `Date is ${yearDifference} years ${
        year < currentYear ? "before" : "after"
      } current year (${currentYear})`,
      field: "date",
    });
  }

  // Check for future dates beyond next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  if (date > nextMonth) {
    result.warnings.push({
      type: "future-date",
      message: "Date is more than one month in the future",
      field: "date",
    });
  }

  return result;
}

/**
 * Validate transaction structure (accounts, amounts, formatting)
 */
function validateTransactionStructure(content: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  const lines = content.trim().split("\n");

  if (lines.length < 2) {
    result.isValid = false;
    result.errors.push({
      type: "invalid-structure",
      message:
        "Transaction must have at least a date line and one account line",
      field: "structure",
    });
    return result;
  }

  // Check account lines (skip first line which is the date/description)
  const accountLines = lines.slice(1);

  for (let i = 0; i < accountLines.length; i++) {
    const line = accountLines[i].trim();

    // Skip empty lines
    if (line.length === 0) continue;

    // Check if line starts with spaces (proper indentation)
    if (!lines[i + 1].startsWith("    ") && !lines[i + 1].startsWith("\t")) {
      result.isValid = false;
      result.errors.push({
        type: "invalid-structure",
        message: `Account line ${
          i + 1
        } must be indented with 4 spaces or a tab`,
        field: "structure",
        suggestion:
          "Indent account lines with spaces: '    Account:Name    Amount'",
      });
      continue;
    }

    // Parse account line
    const accountMatch = line.match(
      /^(.+?)\s+([+-]?\$?\d+\.?\d*)\s*([A-Z]{3})?\s*$/
    );
    if (!accountMatch) {
      result.isValid = false;
      result.errors.push({
        type: "invalid-structure",
        message: `Invalid account line format: "${line}"`,
        field: "structure",
        suggestion: "Format: 'Account:Name    Amount [Currency]'",
      });
      continue;
    }

    const [, account, amountStr] = accountMatch;

    // Check for missing account name
    if (!account.trim()) {
      result.isValid = false;
      result.errors.push({
        type: "invalid-structure",
        message: `Account name is missing on line ${i + 1}`,
        field: "structure",
        suggestion: "Add an account name before the amount",
      });
    }

    // Check for missing amount
    if (!amountStr.trim()) {
      result.isValid = false;
      result.errors.push({
        type: "missing-amount",
        message: `Amount is missing on line ${i + 1}`,
        field: "amount",
        suggestion: "Add an amount after the account name",
      });
    }
  }

  return result;
}

/**
 * Validate transaction balance (debits = credits)
 */
function validateTransactionBalance(content: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  const lines = content.trim().split("\n");
  const accountLines = lines.slice(1);

  let totalDebits = 0;
  let totalCredits = 0;
  const transactionLines: TransactionLine[] = [];

  for (const line of accountLines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Parse the line
    const match = trimmed.match(
      /^(.+?)\s+([+-]?\$?\d+\.?\d*)\s*([A-Z]{3})?\s*$/
    );
    if (!match) continue;

    const [, account, amountStr] = match;

    // Clean amount string (remove $ and convert to number)
    const cleanAmount = amountStr.replace(/[$,]/g, "");
    const numericAmount = parseFloat(cleanAmount);

    if (isNaN(numericAmount)) continue;

    const isDebit = numericAmount > 0;
    transactionLines.push({
      account: account.trim(),
      amount: amountStr.trim(),
      isDebit,
      numericAmount: Math.abs(numericAmount),
    });

    if (isDebit) {
      totalDebits += Math.abs(numericAmount);
    } else {
      totalCredits += Math.abs(numericAmount);
    }
  }

  // Check if transaction has at least 2 lines
  if (transactionLines.length < 2) {
    result.isValid = false;
    result.errors.push({
      type: "unbalanced",
      message: "Transaction must have at least 2 account lines",
      field: "balance",
      suggestion: "Add at least one debit and one credit line",
    });
    return result;
  }

  // Check balance (allow small rounding differences)
  const difference = Math.abs(totalDebits - totalCredits);
  const tolerance = 0.01; // 1 cent tolerance for rounding

  if (difference > tolerance) {
    result.isValid = false;
    result.errors.push({
      type: "unbalanced",
      message: `Transaction is unbalanced: Debits (${totalDebits.toFixed(
        2
      )}) ≠ Credits (${totalCredits.toFixed(2)})`,
      field: "balance",
      suggestion: `Adjust amounts so debits equal credits. Difference: ${difference.toFixed(
        2
      )}`,
    });
  }

  return result;
}
