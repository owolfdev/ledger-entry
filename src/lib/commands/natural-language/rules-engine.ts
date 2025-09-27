/**
 * Rules Engine for Natural Language Processing
 * Loads and applies rules from GitHub repo to map natural language to accounts
 */

import { ParsedAddCommand } from "./parser";

export interface RuleSet {
  version: string;
  defaults: {
    entity: string;
    currency: string;
    fallbackCredit: string;
  };
  items: RuleItem[];
  merchants: RuleMerchant[];
  payments: RulePayment[];
}

export interface RuleItem {
  pattern: string;
  debit: string;
  priority: number;
  learned?: boolean;
  confidence?: number;
}

export interface RuleMerchant {
  pattern: string;
  defaultDebit: string;
  learned?: boolean;
  confidence?: number;
}

export interface RulePayment {
  pattern: string;
  credit: string;
  learned?: boolean;
  confidence?: number;
}

export interface AccountInfo {
  name: string;
  aliases?: string[];
}

export interface RulesContext {
  owner: string;
  repo: string;
}

// Simple in-memory cache for rules and accounts, keyed by owner/repo
const RULES_CACHE = new Map<
  string,
  { rules: MergedRuleSet; accounts: AccountInfo[] }
>();

/**
 * Load all rules from GitHub repo with precedence
 */
export async function loadRules(context: RulesContext): Promise<{
  rules: MergedRuleSet;
  accounts: AccountInfo[];
}> {
  const cacheKey = `${context.owner}/${context.repo}`;

  // Return cached value if available
  const cached = RULES_CACHE.get(cacheKey);
  if (cached) {
    // console.log(`✅ Using cached rules for ${cacheKey}`);
    return { rules: cached.rules, accounts: cached.accounts };
  }

  // console.log(`🔄 Loading rules from GitHub: ${context.owner}/${context.repo}`);

  try {
    // Load rules files in precedence order (highest to lowest)
    const rulesFiles = [
      { path: "rules/30-learned.json", priority: 30 },
      { path: "rules/20-user.json", priority: 20 },
      { path: "rules/10-templates.json", priority: 10 },
      { path: "rules/00-base.json", priority: 0 },
    ];

    const loadedRules: RuleSet[] = [];

    for (const file of rulesFiles) {
      try {
        // console.log(`📁 Loading rules file: ${file.path}`);
        const response = await fetch(
          `/api/github/files?owner=${context.owner}&repo=${
            context.repo
          }&path=${encodeURIComponent(file.path)}`
        );

        // console.log(`📡 Response status for ${file.path}: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          const ruleSet: RuleSet = JSON.parse(data.content);
          // console.log(
          //   `✅ Loaded ${file.path}: ${ruleSet.items?.length || 0} items, ${
          //     ruleSet.merchants?.length || 0
          //   } merchants, ${ruleSet.payments?.length || 0} payments`
          // );
          loadedRules.push(ruleSet);
        } else {
          // console.log(
          //   `❌ Failed to load ${file.path}: ${response.status} ${response.statusText}`
          // );
        }
      } catch (_error) {
        // console.warn(`Failed to load rules file ${file.path}:`, error);
      }
    }

    // Load accounts.journal
    let accounts: AccountInfo[] = [];
    try {
      // console.log(`📁 Loading accounts.journal`);
      const response = await fetch(
        `/api/github/files?owner=${context.owner}&repo=${context.repo}&path=accounts.journal`
      );

      // console.log(
      //   `📡 Response status for accounts.journal: ${response.status}`
      // );

      if (response.ok) {
        const data = await response.json();
        accounts = parseAccountsJournal(data.content);
        // console.log(`✅ Loaded accounts.journal: ${accounts.length} accounts`);
      } else {
        // console.log(
        //   `❌ Failed to load accounts.journal: ${response.status} ${response.statusText}`
        // );
      }
    } catch (_error) {
      // console.warn("Failed to load accounts.journal:", error);
    }

    // Merge rules with precedence
    // console.log(`🔀 Merging ${loadedRules.length} rule sets`);
    const mergedRules = mergeRules(loadedRules);
    // console.log(
    //   `📊 Final merged rules: ${mergedRules.items.length} items, ${mergedRules.merchants.length} merchants, ${mergedRules.payments.length} payments`
    // );

    // Store in cache
    RULES_CACHE.set(cacheKey, {
      rules: mergedRules,
      accounts,
    });

    return { rules: mergedRules, accounts };
  } catch (_error) {
    // console.error("Failed to load rules:", error);
    throw new Error("Failed to load rules from repository");
  }
}

/**
 * Parse accounts.journal to extract account names and aliases
 */
function parseAccountsJournal(content: string): AccountInfo[] {
  const accounts: AccountInfo[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse account declarations
    const accountMatch = trimmed.match(/^account\s+(.+)$/);
    if (accountMatch) {
      accounts.push({
        name: accountMatch[1],
        aliases: [],
      });
    }

    // Parse aliases
    const aliasMatch = trimmed.match(/^alias\s+(\w+)\s*=\s*(.+)$/);
    if (aliasMatch) {
      const alias = aliasMatch[1];
      const accountName = aliasMatch[2];

      // Find the account and add alias
      const account = accounts.find((acc) => acc.name === accountName);
      if (account) {
        if (!account.aliases) {
          account.aliases = [];
        }
        account.aliases.push(alias);
      }
    }
  }

  return accounts;
}

/**
 * Merge multiple rule sets with precedence
 */
function mergeRules(ruleSets: RuleSet[]): MergedRuleSet {
  // Sort by priority (highest first)
  // For now, we'll use the order in which they were loaded
  // In a real implementation, we'd track file priority based on filename

  const merged: MergedRuleSet = {
    defaults: {
      entity: "Personal",
      currency: "THB",
      fallbackCredit: "Personal:Assets:Bank:KBank:Checking",
    },
    items: [],
    merchants: [],
    payments: [],
    accounts: [],
  };

  // Apply defaults (highest priority wins)
  for (const ruleSet of ruleSets) {
    if (ruleSet.defaults.entity && !merged.defaults.entity) {
      merged.defaults.entity = ruleSet.defaults.entity;
    }
    if (ruleSet.defaults.currency && !merged.defaults.currency) {
      merged.defaults.currency = ruleSet.defaults.currency;
    }
    if (ruleSet.defaults.fallbackCredit && !merged.defaults.fallbackCredit) {
      merged.defaults.fallbackCredit = ruleSet.defaults.fallbackCredit;
    }
  }

  // Merge items, merchants, payments (all rules are included)
  for (const ruleSet of ruleSets) {
    merged.items.push(...ruleSet.items);
    merged.merchants.push(...ruleSet.merchants);
    merged.payments.push(...ruleSet.payments);
  }

  // Sort items by priority (highest first)
  merged.items.sort((a, b) => b.priority - a.priority);

  return merged;
}

export interface MergedRuleSet {
  defaults: {
    entity: string;
    currency: string;
    fallbackCredit: string;
  };
  items: RuleItem[];
  merchants: RuleMerchant[];
  payments: RulePayment[];
  accounts: AccountInfo[];
}

/**
 * Apply rules to map natural language to accounts
 */
export function applyRules(
  parsedCommand: ParsedAddCommand,
  rules: MergedRuleSet
): {
  debitAccounts: Array<{
    account: string;
    amount: number;
    currency: string;
    itemName: string;
  }>;
  creditAccount: string;
  currency: string;
  entity: string;
  merchant?: string;
} {
  const { items, merchant, payment, entity, currency } = parsedCommand;

  // Determine entity
  const targetEntity = entity || rules.defaults.entity;

  // Determine currency
  const targetCurrency = currency || rules.defaults.currency;

  // Map items to debit accounts
  const debitAccounts: Array<{
    account: string;
    amount: number;
    currency: string;
    itemName: string;
  }> = [];

  for (const item of items) {
    let debitAccount = findItemAccount(item.name, rules);

    // Only use merchant account as fallback if no item rule matched
    if (!debitAccount && merchant) {
      const merchantAccount = findMerchantAccount(merchant, rules);
      if (merchantAccount) {
        debitAccount = merchantAccount;
        // console.log(
        //   `🔄 Using merchant fallback for "${item.name}": ${merchantAccount}`
        // );
      }
    }

    // Replace entity in account name if different from default
    if (debitAccount && targetEntity !== rules.defaults.entity) {
      const _originalAccount = debitAccount;
      // Replace the first part (entity) of the account name
      const parts = debitAccount.split(":");
      if (parts.length > 1) {
        parts[0] = targetEntity;
        debitAccount = parts.join(":");
        // console.log(
        //   `🔄 Entity replacement: "${originalAccount}" -> "${debitAccount}"`
        // );
      }
    }

    // Fallback to a generic expense account
    if (!debitAccount) {
      debitAccount = `${targetEntity}:Expenses:General`;
    }

    debitAccounts.push({
      account: debitAccount,
      amount: item.amount,
      currency: item.currency || targetCurrency,
      itemName: item.name,
    });
  }

  // Determine credit account
  let creditAccount = payment ? findPaymentAccount(payment, rules) : null;
  if (!creditAccount) {
    creditAccount = rules.defaults.fallbackCredit;
  }

  // Replace entity in credit account name if different from default
  if (creditAccount && targetEntity !== rules.defaults.entity) {
    const _originalCreditAccount = creditAccount;
    // Replace the first part (entity) of the account name
    const parts = creditAccount.split(":");
    if (parts.length > 1) {
      parts[0] = targetEntity;
      creditAccount = parts.join(":");
      // console.log(
      //   `🔄 Credit entity replacement: "${originalCreditAccount}" -> "${creditAccount}"`
      // );
    }
  }

  return {
    debitAccounts,
    creditAccount,
    currency: targetCurrency,
    entity: targetEntity,
    merchant,
  };
}

/**
 * Find account for an item using rules
 */
function findItemAccount(
  itemName: string,
  rules: MergedRuleSet
): string | null {
  // console.log(`🔍 Finding account for item: "${itemName}"`);
  // console.log(`📋 Available item rules: ${rules.items.length}`);

  for (const item of rules.items) {
    try {
      // Remove (?i) inline flag if present, as JavaScript doesn't support it
      const cleanPattern = item.pattern.replace(/^\(\?i\)/, "");
      const regex = new RegExp(cleanPattern, "i");
      if (regex.test(itemName)) {
        // console.log(`✅ Matched item rule: "${item.pattern}" -> ${item.debit}`);
        return item.debit;
      }
    } catch {
      // console.warn(`Invalid regex pattern in item rule: ${item.pattern}`);
    }
  }

  // console.log(`❌ No item rule matched for: "${itemName}"`);
  return null;
}

/**
 * Find account for a merchant using rules
 */
function findMerchantAccount(
  merchantName: string,
  rules: MergedRuleSet
): string | null {
  // console.log(`🏪 Finding merchant account for: "${merchantName}"`);
  // console.log(`📋 Available merchant rules: ${rules.merchants.length}`);

  for (const merchant of rules.merchants) {
    try {
      // Remove (?i) inline flag if present, as JavaScript doesn't support it
      const cleanPattern = merchant.pattern.replace(/^\(\?i\)/, "");
      const regex = new RegExp(cleanPattern, "i");
      if (regex.test(merchantName)) {
        // console.log(
        //   `✅ Matched merchant rule: "${merchant.pattern}" -> ${merchant.defaultDebit}`
        // );
        return merchant.defaultDebit;
      }
    } catch {
      // console.warn(
      //   `Invalid regex pattern in merchant rule: ${merchant.pattern}`
      // );
    }
  }

  // console.log(`❌ No merchant rule matched for: "${merchantName}"`);
  return null;
}

/**
 * Find account for a payment method using rules
 */
function findPaymentAccount(
  paymentMethod: string,
  rules: MergedRuleSet
): string | null {
  if (!paymentMethod) return null;

  for (const payment of rules.payments) {
    try {
      // Remove (?i) inline flag if present, as JavaScript doesn't support it
      const cleanPattern = payment.pattern.replace(/^\(\?i\)/, "");
      const regex = new RegExp(cleanPattern, "i");
      if (regex.test(paymentMethod)) {
        return payment.credit;
      }
    } catch {
      // console.warn(`Invalid regex pattern in payment rule: ${payment.pattern}`);
    }
  }
  return null;
}

/**
 * Generate a Ledger entry from parsed command and applied rules
 */
export function generateLedgerEntry(
  parsedCommand: ParsedAddCommand,
  appliedRules: {
    debitAccounts: Array<{
      account: string;
      amount: number;
      currency: string;
      itemName: string;
    }>;
    creditAccount: string;
    currency: string;
    merchant?: string;
  },
  date?: string
): string {
  const today =
    date || new Date().toISOString().split("T")[0].replace(/-/g, "/");
  const { debitAccounts, creditAccount, currency, merchant } = appliedRules;

  // Calculate total amount
  const totalAmount = debitAccounts.reduce((sum, item) => sum + item.amount, 0);

  // Generate description
  let description = merchant || "Transaction";
  if (!merchant && debitAccounts.length > 1) {
    description = `${debitAccounts.map((item) => item.itemName).join(", ")}`;
  }

  // Generate entry
  let entry = `${today} ${description}\n`;

  // Add debit lines
  for (const item of debitAccounts) {
    const accountName = item.account;
    const amount = item.amount.toFixed(2);
    const itemCurrency = item.currency || currency;
    entry += `    ${accountName.padEnd(40)} ${amount} ${itemCurrency}\n`;
  }

  // Add credit line
  const totalAmountStr = totalAmount.toFixed(2);
  entry += `    ${creditAccount.padEnd(40)} -${totalAmountStr} ${currency}\n`;

  // Add memo if present
  if (parsedCommand.memo) {
    entry += `    ; ${parsedCommand.memo}\n`;
  }

  return entry.trim();
}

/**
 * Invalidate rules cache for a specific repository
 */
export function invalidateRulesCache(owner: string, repo: string): void {
  const cacheKey = `${owner}/${repo}`;
  const wasCached = RULES_CACHE.has(cacheKey);
  RULES_CACHE.delete(cacheKey);

  if (wasCached) {
    // console.log(`🗑️ Invalidated rules cache for ${cacheKey}`);
  }
}

/**
 * Invalidate all rules cache
 */
export function clearRulesCache(): void {
  const count = RULES_CACHE.size;
  RULES_CACHE.clear();

  if (count > 0) {
    // console.log(`🗑️ Cleared all rules cache (${count} entries)`);
  }
}
