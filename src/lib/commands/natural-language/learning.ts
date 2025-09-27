/**
 * Learning System for Natural Language Rules
 * Detects when users modify account mappings and creates learned rules
 */

import { ParsedAddCommand } from "./parser";

export interface LearningContext {
  owner: string;
  repo: string;
  originalCommand: ParsedAddCommand;
  originalAccount: string;
  finalAccount: string;
  itemName: string;
}

export interface LearnedRule {
  pattern: string;
  debit: string;
  priority: number;
  learned: boolean;
  confidence: number;
  createdAt: string;
  usageCount: number;
}

export interface ItemMapping {
  itemName: string;
  originalAccount: string;
  amount: number;
  currency: string;
}

/**
 * Check if a change should trigger learning
 */
export function shouldLearn(
  originalAccount: string,
  finalAccount: string,
  itemName: string
): boolean {
  // Don't learn if accounts are the same
  if (originalAccount === finalAccount) return false;

  // Don't learn if final account is empty or invalid
  if (!finalAccount || finalAccount.trim() === "") return false;

  // Don't learn if item name is empty
  if (!itemName || itemName.trim() === "") return false;

  // Don't learn if the change is too minor (just case changes)
  if (originalAccount.toLowerCase() === finalAccount.toLowerCase())
    return false;

  // Don't learn if it's just adding/removing spaces
  if (originalAccount.replace(/\s+/g, "") === finalAccount.replace(/\s+/g, ""))
    return false;

  return true;
}

/**
 * Generate a learned rule from user correction
 */
export function generateLearnedRule(
  itemName: string,
  finalAccount: string,
  originalAccount: string
): LearnedRule {
  // Create a pattern that matches the specific item name
  const pattern = `(?i)${escapeRegex(itemName)}`;

  // Calculate confidence based on how specific the change is
  const confidence = calculateConfidence(originalAccount, finalAccount);

  return {
    pattern,
    debit: finalAccount,
    priority: 20, // Higher than template rules (10) but lower than user rules (25)
    learned: true,
    confidence,
    createdAt: new Date().toISOString(),
    usageCount: 1,
  };
}

/**
 * Load existing learned rules from 30-learned.json
 */
export async function loadLearnedRules(
  owner: string,
  repo: string
): Promise<LearnedRule[]> {
  try {
    const response = await fetch(
      `/api/github/files?owner=${owner}&repo=${repo}&path=rules/30-learned.json`
    );

    if (!response.ok) {
      // console.log("No learned rules file found, starting fresh");
      return [];
    }

    const data = await response.json();
    const ruleSet = JSON.parse(data.content);
    return ruleSet.items || [];
  } catch (_error) {
    // console.warn("Failed to load learned rules:", error);
    return [];
  }
}

/**
 * Save learned rules to 30-learned.json
 */
export async function saveLearnedRules(
  owner: string,
  repo: string,
  rules: LearnedRule[]
): Promise<void> {
  const ruleSet = {
    version: "1.0",
    defaults: {},
    items: rules,
    merchants: [],
    payments: [],
  };

  const response = await fetch("/api/github/files", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      owner,
      repo,
      path: "rules/30-learned.json",
      content: JSON.stringify(ruleSet, null, 2),
      message: `learning: add rule for ${
        rules[rules.length - 1]?.pattern || "unknown"
      }`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save learned rules: ${response.statusText}`);
  }
}

/**
 * Learn from user correction
 */
export async function learnFromCorrection(
  context: LearningContext
): Promise<boolean> {
  const { owner, repo, originalAccount, finalAccount, itemName } = context;

  // Check if we should learn from this change
  if (!shouldLearn(originalAccount, finalAccount, itemName)) {
    return false;
  }

  try {
    // Load existing learned rules
    const existingRules = await loadLearnedRules(owner, repo);

    // Check if we already have a rule for this item
    const existingRule = existingRules.find((rule) =>
      rule.pattern.toLowerCase().includes(itemName.toLowerCase())
    );

    if (existingRule) {
      // Update existing rule
      existingRule.debit = finalAccount;
      existingRule.confidence = Math.min(existingRule.confidence + 0.1, 1.0);
      existingRule.usageCount += 1;
    } else {
      // Create new learned rule
      const newRule = generateLearnedRule(
        itemName,
        finalAccount,
        originalAccount
      );
      existingRules.push(newRule);
    }

    // Save updated rules
    await saveLearnedRules(owner, repo, existingRules);

    // Invalidate rules cache so the new rule is immediately available
    try {
      const { invalidateRulesCache } = await import("./rules-engine");
      invalidateRulesCache(owner, repo);
    } catch (_error) {
      // console.warn("Failed to invalidate rules cache after learning:", error);
    }

    return true;
  } catch (_error) {
    // console.error("Failed to learn from correction:", error);
    return false;
  }
}

/**
 * Detect account changes between original and final entries
 */
export function detectAccountChanges(
  originalEntry: string,
  finalEntry: string,
  itemMappings: ItemMapping[]
): Array<{
  itemName: string;
  originalAccount: string;
  finalAccount: string;
  amount: number;
  currency: string;
}> {
  const changes: Array<{
    itemName: string;
    originalAccount: string;
    finalAccount: string;
    amount: number;
    currency: string;
  }> = [];

  // Parse final entry to extract account lines
  const finalAccountLines = parseAccountLines(finalEntry);

  // Check each item mapping for changes
  for (const mapping of itemMappings) {
    // Find the corresponding account line in the final content
    const finalAccountLine = finalAccountLines.find(
      (line) =>
        line.account.includes(mapping.itemName) ||
        line.account === mapping.originalAccount ||
        Math.abs(parseFloat(line.amount) - mapping.amount) < 0.01
    );

    if (
      finalAccountLine &&
      finalAccountLine.account !== mapping.originalAccount
    ) {
      changes.push({
        itemName: mapping.itemName,
        originalAccount: mapping.originalAccount,
        finalAccount: finalAccountLine.account,
        amount: mapping.amount,
        currency: mapping.currency,
      });
    }
  }

  return changes;
}

/**
 * Parse account lines from ledger entry
 */
function parseAccountLines(
  entry: string
): Array<{ account: string; amount: string }> {
  const lines = entry.split("\n");
  const accountLines: Array<{ account: string; amount: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match ledger account lines (4 spaces + account + amount)
    // Also handle lines that might have different spacing
    const match = trimmed.match(/^    (.+?)\s+(-?\d+(?:\.\d{2})?\s+\w+)$/);
    if (match) {
      accountLines.push({
        account: match[1].trim(),
        amount: match[2].trim(),
      });
    } else if (
      trimmed.includes("Personal:") ||
      trimmed.includes("Channel60:")
    ) {
      // Fallback: look for lines containing account patterns
      const fallbackMatch = trimmed.match(/(.+?)\s+(-?\d+(?:\.\d{2})?\s+\w+)$/);
      if (fallbackMatch) {
        accountLines.push({
          account: fallbackMatch[1].trim(),
          amount: fallbackMatch[2].trim(),
        });
      }
    }
  }
  return accountLines;
}

/**
 * Calculate confidence score for learned rule
 */
function calculateConfidence(
  originalAccount: string,
  finalAccount: string
): number {
  // Base confidence
  let confidence = 0.7;

  // Increase confidence if the change is more specific
  const originalDepth = originalAccount.split(":").length;
  const finalDepth = finalAccount.split(":").length;

  if (finalDepth > originalDepth) {
    confidence += 0.2; // More specific account
  }

  // Increase confidence if the change is substantial
  const similarity = calculateSimilarity(originalAccount, finalAccount);
  if (similarity < 0.5) {
    confidence += 0.1; // Substantial change
  }

  return Math.min(confidence, 1.0);
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
