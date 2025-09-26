# **Ledger Commands System — Technical Specification**

**Owner:** OWolf / Ledger Entry  
**Status:** Design Phase  
**Scope:** Emulated Ledger CLI commands (balance, register, prices) implemented in JavaScript, processing GitHub-stored ledger data to provide professional reporting capabilities through the web interface.

---

## **1. Objectives**

- **Implement emulated Ledger CLI commands** (balance, register, prices) in JavaScript
- **Process GitHub-stored ledger data** to provide real-time reporting capabilities
- **Support multi-currency analysis** with JavaScript-based exchange rate handling
- **Integrate educational guidance** by explaining command usage and results
- **Ensure mobile compatibility** for command execution and result display
- **Preserve data ownership** by using user's GitHub repositories as the source of truth
- **Enable advanced users** to clone repositories and use real Ledger CLI locally

---

## **2. Core Architecture Overview**

### **Components**

- **Command Parser**: Extends existing command system to recognize emulated Ledger commands
- **GitHub Data Fetcher**: Retrieves ledger files from user repositories
- **Ledger File Parser**: Parses ledger files (main.journal, accounts.journal, journals) in JavaScript
- **Command Emulator**: Implements balance, register, and prices commands in JavaScript
- **Result Formatter**: Formats and displays command results with educational context
- **Multi-Currency Handler**: Manages currency-specific commands and exchange rates

### **Data Flow**

```
User Input → Command Parser → GitHub Data Fetch → Ledger File Parsing → JavaScript Command Execution → Result Display
```

---

## **3. Command System Architecture**

### **3.1 Command Types**

**Core Commands:**

```typescript
interface LedgerCommand {
  type: "balance" | "register" | "prices";
  args: string[];
  options: {
    currency?: string;
    exchange?: string;
    dateRange?: {
      begin?: string;
      end?: string;
    };
    format?: "table" | "csv" | "json";
  };
  category: "daily" | "monthly" | "analysis" | "planning";
}
```

**Command Categories:**

```typescript
const commandCategories = {
  daily: [
    "balance",
    "balance assets",
    "balance expenses",
    "balance liabilities",
    "register --tail 20",
  ],
  monthly: [
    'balance expenses --begin "this month"',
    "register expenses --monthly",
    "balance assets liabilities",
    'register --begin "this month"',
  ],
  analysis: [
    "balance --currency USD",
    "balance --exchange THB",
    "register --group-by payee expenses",
    'balance expenses --begin "this year"',
  ],
  planning: [
    'balance expenses --monthly --begin "6 months ago"',
    "register expenses --average",
    "prices",
  ],
};
```

### **3.2 Popular Commands Implementation**

**Daily/Weekly Commands:**

```typescript
const dailyCommands = [
  {
    command: "balance",
    description: "Quick balance check (most common)",
    example: "balance",
    educational: "Shows your current financial position across all accounts",
  },
  {
    command: "balance assets",
    description: "Balance for assets only",
    example: "balance assets",
    educational: "Shows what you own - cash, bank accounts, investments",
  },
  {
    command: 'balance expenses --begin "this month"',
    description: "Month-to-date expenses",
    example: 'balance expenses --begin "this month"',
    educational: "Track your spending for the current month",
  },
];
```

**Monthly/Regular Review Commands:**

```typescript
const monthlyCommands = [
  {
    command: 'register expenses --monthly --begin "this year"',
    description: "Monthly expense report",
    example: 'register expenses --monthly --begin "this year"',
    educational: "See how your expenses have changed month by month",
  },
  {
    command: "register --tail 20",
    description: "Register of recent transactions",
    example: "register --tail 20",
    educational: "Review your most recent transactions for accuracy",
  },
  {
    command: "balance assets liabilities",
    description: "Net worth calculation",
    example: "balance assets liabilities",
    educational: "Calculate your net worth (what you own minus what you owe)",
  },
];
```

---

## **4. GitHub Data Integration**

### **4.1 Data Fetching Strategy**

**File Retrieval:**

```typescript
interface LedgerData {
  main: string;
  accounts: string;
  journals: JournalFile[];
  rules: RuleFile[];
}

interface JournalFile {
  name: string;
  path: string;
  content: string;
  lastModified: string;
}

async function fetchLedgerData(repo: Repository): Promise<LedgerData> {
  // Fetch main.journal
  const main = await fetchFileContent(repo, "main.journal");

  // Fetch accounts.journal
  const accounts = await fetchFileContent(repo, "accounts.journal");

  // Fetch all journal files from journals/ directory
  const journals = await fetchJournalFiles(repo, "journals/");

  // Fetch rules files
  const rules = await fetchRuleFiles(repo, "rules/");

  return { main, accounts, journals, rules };
}
```

**Caching Strategy:**

```typescript
interface DataCache {
  repository: string;
  lastFetch: Date;
  data: LedgerData;
  ttl: number; // Time to live in minutes
}

class GitHubDataManager {
  private cache = new Map<string, DataCache>();

  async getLedgerData(
    repo: Repository,
    forceRefresh = false
  ): Promise<LedgerData> {
    const cacheKey = `${repo.owner}/${repo.repo}`;
    const cached = this.cache.get(cacheKey);

    // Check if cache is valid
    if (!forceRefresh && cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await fetchLedgerData(repo);

    // Update cache
    this.cache.set(cacheKey, {
      repository: cacheKey,
      lastFetch: new Date(),
      data,
      ttl: 5, // 5 minutes cache
    });

    return data;
  }

  private isCacheValid(cached: DataCache): boolean {
    const now = new Date();
    const age = now.getTime() - cached.lastFetch.getTime();
    return age < cached.ttl * 60 * 1000;
  }
}
```

### **4.2 File Structure Support**

**Supported File Types:**

```
user-repo/
├── main.journal          ← Main ledger file with includes
├── accounts.journal      ← Chart of accounts and aliases
├── journals/             ← Monthly transaction files
│   ├── 2025-01.journal
│   ├── 2025-02.journal
│   └── ...
├── rules/                ← JSON rules for natural language
│   ├── 00-base.json
│   ├── 10-templates.json
│   ├── 20-user.json
│   └── 30-learned.json
└── prices.db            ← Optional exchange rates (future)
```

---

## **5. Ledger File Parsing and Command Emulation**

### **5.1 Ledger File Parser**

**Core Parser Engine:**

```typescript
interface ParsedLedgerData {
  accounts: Account[];
  transactions: Transaction[];
  prices: PriceEntry[];
  includes: string[];
}

interface Account {
  name: string;
  type: "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses" | "COGS";
  parent?: string;
  isPostable: boolean;
  aliases: string[];
}

interface Transaction {
  date: Date;
  description: string;
  postings: Posting[];
  cleared: boolean;
  pending: boolean;
}

interface Posting {
  account: string;
  amount: number;
  currency: string;
  commodity?: string;
}

class LedgerFileParser {
  async parseLedgerData(data: LedgerData): Promise<ParsedLedgerData> {
    const accounts = await this.parseAccounts(data.accounts);
    const transactions = await this.parseTransactions(data.main, data.journals);
    const prices = await this.parsePrices(data);
    const includes = this.parseIncludes(data.main);

    return { accounts, transactions, prices, includes };
  }

  private async parseAccounts(accountsContent: string): Promise<Account[]> {
    const accounts: Account[] = [];
    const lines = accountsContent.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse account declarations
      const accountMatch = trimmed.match(/^account\s+(.+)$/);
      if (accountMatch) {
        const accountName = accountMatch[1];
        const accountType = this.determineAccountType(accountName);
        accounts.push({
          name: accountName,
          type: accountType,
          isPostable: true,
          aliases: [],
        });
      }

      // Parse aliases
      const aliasMatch = trimmed.match(/^alias\s+(\w+)\s*=\s*(.+)$/);
      if (aliasMatch) {
        const [, alias, accountName] = aliasMatch;
        const account = accounts.find((a) => a.name === accountName);
        if (account) {
          account.aliases.push(alias);
        }
      }
    }

    return accounts;
  }

  private async parseTransactions(
    mainContent: string,
    journals: JournalFile[]
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    // Parse main journal file
    transactions.push(...this.parseJournalTransactions(mainContent));

    // Parse journal files
    for (const journal of journals) {
      transactions.push(...this.parseJournalTransactions(journal.content));
    }

    return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private parseJournalTransactions(content: string): Transaction[] {
    const transactions: Transaction[] = [];
    const lines = content.split("\n");

    let currentTransaction: Transaction | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("!")) {
        continue;
      }

      // Check if this is a transaction header (starts with date)
      const dateMatch = trimmed.match(
        /^(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})(\s+\*|\s+!)?\s*(.+)$/
      );
      if (dateMatch) {
        // Save previous transaction if exists
        if (currentTransaction) {
          transactions.push(currentTransaction);
        }

        // Start new transaction
        const [, dateStr, cleared, description] = dateMatch;
        currentTransaction = {
          date: this.parseDate(dateStr),
          description: description.trim(),
          postings: [],
          cleared: !!cleared,
          pending: false,
        };
        continue;
      }

      // Parse posting lines
      if (
        currentTransaction &&
        (trimmed.startsWith(" ") || trimmed.startsWith("\t"))
      ) {
        const posting = this.parsePosting(trimmed);
        if (posting) {
          currentTransaction.postings.push(posting);
        }
      }
    }

    // Add last transaction
    if (currentTransaction) {
      transactions.push(currentTransaction);
    }

    return transactions;
  }

  private parsePosting(line: string): Posting | null {
    // Parse posting format: "    Account Name            Amount Currency"
    const match = line.trim().match(/^(.+?)\s+(-?\d+(?:\.\d+)?)\s+(\w+)$/);
    if (match) {
      const [, account, amount, currency] = match;
      return {
        account: account.trim(),
        amount: parseFloat(amount),
        currency,
      };
    }
    return null;
  }

  private determineAccountType(accountName: string): Account["type"] {
    if (accountName.startsWith("Assets")) return "Assets";
    if (accountName.startsWith("Liabilities")) return "Liabilities";
    if (accountName.startsWith("Equity")) return "Equity";
    if (accountName.startsWith("Income")) return "Income";
    if (accountName.startsWith("Expenses")) return "Expenses";
    if (accountName.startsWith("COGS")) return "COGS";
    return "Assets"; // Default fallback
  }

  private parseDate(dateStr: string): Date {
    // Handle various date formats
    const normalized = dateStr.replace(/\//g, "-");
    return new Date(normalized);
  }
}
```

### **5.2 Command Emulator**

**Emulated Command Engine:**

```typescript
interface CommandExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  command: string;
}

class EmulatedLedgerCommands {
  private parser: LedgerFileParser;
  private parsedData: ParsedLedgerData | null = null;

  constructor() {
    this.parser = new LedgerFileParser();
  }

  async executeCommand(
    command: LedgerCommand,
    data: LedgerData,
    options: ExecutionOptions = {}
  ): Promise<CommandExecutionResult> {
    const startTime = Date.now();

    try {
      // Parse ledger data if not already parsed
      if (!this.parsedData) {
        this.parsedData = await this.parser.parseLedgerData(data);
      }

      // Execute the appropriate command
      let output: string;
      let success = true;

      switch (command.type) {
        case "balance":
          output = await this.executeBalance(command, this.parsedData);
          break;
        case "register":
          output = await this.executeRegister(command, this.parsedData);
          break;
        case "prices":
          output = await this.executePrices(command, this.parsedData);
          break;
        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }

      return {
        success,
        output,
        executionTime: Date.now() - startTime,
        command: `${command.type} ${command.args.join(" ")}`,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
        command: `${command.type} ${command.args.join(" ")}`,
      };
    }
  }

  private async executeBalance(
    command: LedgerCommand,
    data: ParsedLedgerData
  ): Promise<string> {
    const accounts = this.filterAccounts(command, data.accounts);
    const balances = this.calculateBalances(
      data.transactions,
      accounts,
      command.options
    );

    return this.formatBalanceOutput(balances, command.options);
  }

  private async executeRegister(
    command: LedgerCommand,
    data: ParsedLedgerData
  ): Promise<string> {
    const transactions = this.filterTransactions(command, data.transactions);

    return this.formatRegisterOutput(transactions, command.options);
  }

  private async executePrices(
    command: LedgerCommand,
    data: ParsedLedgerData
  ): Promise<string> {
    const prices = this.filterPrices(command, data.prices);

    return this.formatPricesOutput(prices, command.options);
  }

  private calculateBalances(
    transactions: Transaction[],
    accounts: Account[],
    options: LedgerCommand["options"]
  ): Map<string, number> {
    const balances = new Map<string, number>();

    // Initialize balances for all accounts
    for (const account of accounts) {
      balances.set(account.name, 0);
    }

    // Process transactions
    for (const transaction of transactions) {
      // Apply date filters
      if (
        options.dateRange?.begin &&
        transaction.date < this.parseDateRange(options.dateRange.begin)
      ) {
        continue;
      }
      if (
        options.dateRange?.end &&
        transaction.date > this.parseDateRange(options.dateRange.end)
      ) {
        continue;
      }

      // Process postings
      for (const posting of transaction.postings) {
        // Apply currency filters
        if (options.currency && posting.currency !== options.currency) {
          continue;
        }

        const currentBalance = balances.get(posting.account) || 0;
        balances.set(posting.account, currentBalance + posting.amount);
      }
    }

    return balances;
  }

  private filterAccounts(
    command: LedgerCommand,
    accounts: Account[]
  ): Account[] {
    // Filter accounts based on command arguments
    if (command.args.length === 0) {
      return accounts;
    }

    const filter = command.args[0].toLowerCase();
    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(filter) ||
        account.type.toLowerCase() === filter
    );
  }

  private filterTransactions(
    command: LedgerCommand,
    transactions: Transaction[]
  ): Transaction[] {
    // Apply various filters based on command arguments
    let filtered = [...transactions];

    // Filter by account if specified
    const accountFilter = command.args.find(
      (arg) => !arg.startsWith("--") && !arg.startsWith("-")
    );
    if (accountFilter) {
      filtered = filtered.filter((t) =>
        t.postings.some((p) =>
          p.account.toLowerCase().includes(accountFilter.toLowerCase())
        )
      );
    }

    // Apply date filters
    if (command.options.dateRange?.begin) {
      const beginDate = this.parseDateRange(command.options.dateRange.begin);
      filtered = filtered.filter((t) => t.date >= beginDate);
    }
    if (command.options.dateRange?.end) {
      const endDate = this.parseDateRange(command.options.dateRange.end);
      filtered = filtered.filter((t) => t.date <= endDate);
    }

    // Apply tail limit
    const tailIndex = command.args.indexOf("--tail");
    if (tailIndex !== -1 && tailIndex + 1 < command.args.length) {
      const limit = parseInt(command.args[tailIndex + 1]);
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  private formatBalanceOutput(
    balances: Map<string, number>,
    options: LedgerCommand["options"]
  ): string {
    const lines: string[] = [];

    for (const [account, balance] of balances.entries()) {
      if (balance === 0) continue; // Skip zero balances

      const formattedBalance = balance.toFixed(2);
      const paddedAccount = account.padEnd(40);
      lines.push(`${paddedAccount} ${formattedBalance}`);
    }

    return lines.join("\n");
  }

  private formatRegisterOutput(
    transactions: Transaction[],
    options: LedgerCommand["options"]
  ): string {
    const lines: string[] = [];

    for (const transaction of transactions) {
      lines.push(
        `${this.formatDate(transaction.date)} ${transaction.description}`
      );
      for (const posting of transaction.postings) {
        const paddedAccount = posting.account.padEnd(40);
        const formattedAmount = posting.amount.toFixed(2);
        lines.push(
          `    ${paddedAccount} ${formattedAmount} ${posting.currency}`
        );
      }
      lines.push(""); // Empty line between transactions
    }

    return lines.join("\n");
  }

  private formatPricesOutput(
    prices: PriceEntry[],
    options: LedgerCommand["options"]
  ): string {
    // Implementation for prices command
    return "Price data not yet implemented";
  }

  private parseDateRange(dateStr: string): Date {
    // Parse relative dates like "this month", "last month", etc.
    const now = new Date();

    switch (dateStr.toLowerCase()) {
      case "this month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "last month":
        return new Date(now.getFullYear(), now.getMonth() - 1, 1);
      case "this year":
        return new Date(now.getFullYear(), 0, 1);
      case "last year":
        return new Date(now.getFullYear() - 1, 0, 1);
      default:
        // Try to parse as absolute date
        return new Date(dateStr);
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0].replace(/-/g, "/");
  }
}
```

---

## **6. Multi-Currency Support**

### **6.1 Currency Command Handling**

**Currency-Specific Commands:**

```typescript
const currencyCommands = [
  {
    command: "balance --currency USD",
    description: "Show balances in USD only",
    example: "balance --currency USD",
    educational: "Filter balances to show only USD-denominated accounts",
  },
  {
    command: "balance --exchange THB",
    description: "Convert all balances to THB",
    example: "balance --exchange THB",
    educational:
      "Convert all currency balances to Thai Baht using current exchange rates",
  },
  {
    command: "register --currency USD",
    description: "Show USD transactions only",
    example: "register --currency USD",
    educational: "Filter transaction register to show only USD transactions",
  },
  {
    command: "prices",
    description: "Show current exchange rates",
    example: "prices",
    educational:
      "Display current exchange rates used by Ledger for currency conversion",
  },
];
```

### **6.2 Exchange Rate Management**

**Price Data Handling:**

```typescript
interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  date: string;
  source: string;
}

class ExchangeRateManager {
  async getExchangeRates(): Promise<ExchangeRate[]> {
    // For now, return empty array - will be implemented later
    // Could fetch from external APIs or user-provided price data
    return [];
  }

  async getCurrencyConversion(from: string, to: string): Promise<number> {
    const rates = await this.getExchangeRates();
    const conversion = rates.find((r) => r.from === from && r.to === to);
    return conversion?.rate || 1;
  }
}
```

---

## **7. Result Formatting and Display**

### **7.1 Output Formatting**

**Result Display System:**

```typescript
interface FormattedResult {
  title: string;
  content: string;
  educational: EducationalContent;
  metadata: {
    executionTime: number;
    command: string;
    dataSource: string;
    lastUpdated: Date;
  };
}

class ResultFormatter {
  formatBalanceResult(result: CommandExecutionResult): FormattedResult {
    return {
      title: "Account Balances",
      content: this.formatBalanceOutput(result.output),
      educational: {
        explanation:
          "This shows your current account balances. Assets are what you own, liabilities are what you owe.",
        concepts: ["Assets", "Liabilities", "Equity", "Net Worth"],
        examples: [
          "Try: balance assets to see only asset accounts",
          "Try: balance --currency USD for USD-only balances",
        ],
      },
      metadata: {
        executionTime: result.executionTime,
        command: result.command,
        dataSource: "GitHub Repository",
        lastUpdated: new Date(),
      },
    };
  }

  formatRegisterResult(result: CommandExecutionResult): FormattedResult {
    return {
      title: "Transaction Register",
      content: this.formatRegisterOutput(result.output),
      educational: {
        explanation:
          "This shows your transaction history. Use this to review where your money goes.",
        concepts: [
          "Transaction History",
          "Account Activity",
          "Spending Patterns",
        ],
        examples: [
          "Try: register --tail 10 for recent transactions",
          "Try: register expenses for expense transactions only",
        ],
      },
      metadata: {
        executionTime: result.executionTime,
        command: result.command,
        dataSource: "GitHub Repository",
        lastUpdated: new Date(),
      },
    };
  }
}
```

### **7.2 Educational Integration**

**Command Explanations:**

```typescript
const commandEducation = {
  balance: {
    concept: "Account Balances",
    explanation:
      "Shows the current balance of all accounts. Assets show what you own, liabilities show what you owe.",
    examples: [
      "balance - Show all account balances",
      "balance assets - Show only asset accounts",
      "balance --currency USD - Show USD balances only",
    ],
    relatedCommands: ["register", "prices"],
    accountingConcept:
      "The balance command shows your financial position at a point in time.",
  },
  register: {
    concept: "Transaction History",
    explanation:
      "Shows a chronological list of all transactions. This is your financial activity log.",
    examples: [
      "register - Show all transactions",
      "register checking - Show checking account transactions",
      "register --tail 20 - Show last 20 transactions",
    ],
    relatedCommands: ["balance", "prices"],
    accountingConcept:
      "The register shows the flow of money through your accounts over time.",
  },
  prices: {
    concept: "Exchange Rates",
    explanation:
      "Shows current exchange rates used by Ledger for currency conversion.",
    examples: [
      "prices - Show all exchange rates",
      "prices USD - Show USD exchange rates",
      "prices --date 2024-01-01 - Show historical rates",
    ],
    relatedCommands: ["balance --exchange", "register --currency"],
    accountingConcept:
      "Exchange rates are needed to convert between different currencies in your accounts.",
  },
};
```

---

## **8. Mobile Optimization**

### **8.1 Mobile-Friendly Command Interface**

**Responsive Command Input:**

```typescript
interface MobileCommandInterface {
  quickCommands: QuickCommand[];
  commandHistory: CommandHistory[];
  favorites: FavoriteCommand[];
  suggestions: CommandSuggestion[];
}

const quickCommands = [
  {
    id: "balance",
    label: "Balance",
    command: "balance",
    icon: "💰",
    description: "Quick balance check",
  },
  {
    id: "expenses",
    label: "Expenses",
    command: 'balance expenses --begin "this month"',
    icon: "💸",
    description: "Monthly expenses",
  },
  {
    id: "recent",
    label: "Recent",
    command: "register --tail 10",
    icon: "📋",
    description: "Recent transactions",
  },
  {
    id: "networth",
    label: "Net Worth",
    command: "balance assets liabilities",
    icon: "📊",
    description: "Calculate net worth",
  },
];
```

### **8.2 Mobile Result Display**

**Responsive Result Formatting:**

```typescript
interface MobileResultDisplay {
  compact: boolean;
  scrollable: boolean;
  collapsible: boolean;
  shareable: boolean;
}

class MobileResultFormatter {
  formatForMobile(result: FormattedResult): MobileResultDisplay {
    return {
      compact: true,
      scrollable: true,
      collapsible: true,
      shareable: true,
      content: this.compactFormat(result.content),
      educational: this.summarizeEducational(result.educational),
    };
  }

  private compactFormat(content: string): string {
    // Reduce spacing, use shorter labels, optimize for small screens
    return content
      .replace(/\s{2,}/g, " ")
      .replace(/Account/g, "Acct")
      .replace(/Transaction/g, "Txn");
  }
}
```

---

## **9. Implementation Phases**

### **Phase 1: Core Commands (Week 1)**

**Deliverables:**

- Command parser for balance, register, prices
- GitHub data fetching integration
- Basic ledger file parsing
- Simple result display

**Files to Create/Modify:**

```
src/lib/commands/
├── ledger-commands/
│   ├── command-parser.ts        ← Parse ledger commands
│   ├── github-data-fetcher.ts   ← Fetch data from GitHub
│   ├── ledger-file-parser.ts    ← Parse ledger files in JavaScript
│   ├── command-emulator.ts      ← Emulate balance/register/prices
│   └── result-formatter.ts      ← Format command results
├── enhanced-command-system.ts   ← Extend existing command system
└── types/
    └── ledger-commands.ts       ← Type definitions
```

### **Phase 2: Multi-Currency Support (Week 2)**

**Deliverables:**

- Currency-specific command handling
- Exchange rate integration
- Multi-currency result formatting
- Price command implementation

**Files to Create/Modify:**

```
src/lib/commands/ledger-commands/
├── currency-handler.ts          ← Multi-currency support
├── exchange-rate-manager.ts     ← Exchange rate management
└── multi-currency-formatter.ts  ← Currency-specific formatting
```

### **Phase 3: Educational Integration (Week 3)**

**Deliverables:**

- Command explanations and guidance
- Educational content integration
- Progressive learning hints
- Contextual help system

**Files to Create/Modify:**

```
src/lib/education/
├── ledger-command-education.ts  ← Command-specific education
├── result-explanation.ts        ← Result interpretation guidance
└── command-tutorials.ts         ← Interactive command tutorials
```

### **Phase 4: Mobile Optimization (Week 4)**

**Deliverables:**

- Mobile-friendly command interface
- Responsive result display
- Touch-optimized interactions
- Performance optimization

**Files to Create/Modify:**

```
src/components/ledger-commands/
├── mobile-command-interface.tsx ← Mobile command UI
├── mobile-result-display.tsx    ← Mobile result formatting
└── quick-commands.tsx           ← Quick command buttons
```

---

## **10. User Experience Flow**

### **10.1 Command Execution Flow**

```
1. User types: "balance expenses --begin 'this month'"
2. System shows: "🔄 Fetching latest data from GitHub..."
3. System displays: "⚡ Processing: balance expenses --begin 'this month'"
4. System shows results with educational context:

   💰 Monthly Expenses

   Expenses:Food:Coffee        $125.50
   Expenses:Transportation     $89.20
   Expenses:Entertainment      $45.00
   Total Expenses             $259.70

   💡 This shows your expenses for the current month.
   Notice how we can filter by time period.
   📚 Learn more: Try "balance expenses --begin 'this year'" for yearly totals.
```

### **10.2 Educational Integration Flow**

```
1. User runs command for first time
2. System shows: "🎓 New Command: balance"
3. System displays: Educational explanation and examples
4. User can dismiss or explore more educational content
5. System tracks learning progress and suggests next commands
```

---

## **11. Performance Considerations**

### **11.1 Optimization Strategies**

**Caching:**

- GitHub data cached for 5 minutes
- Parsed ledger data cached for 2 minutes
- Command results cached for 1 minute

**Processing Limits:**

- Maximum transactions processed: 10,000
- Maximum accounts: 1,000
- Command timeout: 5 seconds

**Mobile Performance:**

- Lazy loading of command results
- Progressive disclosure of educational content
- Optimized result formatting for small screens

---

## **12. Security and Privacy**

### **12.1 Security Measures**

**Data Protection:**

- No persistent storage of ledger data
- User data remains in their GitHub repository
- Commands only process user's own data

**Input Validation:**

- Command arguments validated before processing
- File size limits for GitHub data
- Sanitized output formatting

---

## **13. Testing Strategy**

### **13.1 Test Coverage**

**Unit Tests:**

- Command parsing accuracy
- GitHub data fetching
- Ledger file parsing
- Result formatting
- Educational content integration

**Integration Tests:**

- End-to-end command execution
- Multi-currency functionality
- Mobile responsiveness
- Error handling

**Performance Tests:**

- Command execution time
- Memory usage during parsing
- Mobile performance benchmarks

---

## **14. Success Metrics**

### **14.1 User Engagement**

**Command Usage:**

- Number of commands executed per user
- Most popular commands
- User retention after using commands

**Educational Impact:**

- Users who explore educational content
- Command complexity progression
- Self-reported confidence improvement

**Performance Metrics:**

- Command execution success rate
- Average execution time
- Mobile vs desktop usage patterns

---

## **15. Future Enhancements**

### **15.1 Advanced Features**

**Reporting:**

- Custom report generation
- Scheduled report delivery
- Export to PDF/CSV

**Analytics:**

- Spending pattern analysis
- Trend identification
- Budget vs actual comparisons

**Integration:**

- Bank account connections
- Receipt scanning integration
- Tax software export

---

## **16. Conclusion**

The Emulated Ledger Commands System transforms Ledger Entry from a simple data entry tool into a **comprehensive financial analysis platform** that provides:

- **Professional reporting capabilities** through JavaScript-based command emulation
- **Real-time data access** from user-owned GitHub repositories
- **Multi-currency support** with exchange rate integration
- **Educational guidance** that teaches users proper command usage
- **Mobile optimization** for on-the-go financial analysis
- **User data ownership** with the ability to export to real Ledger CLI

This system positions Ledger Entry as the **premier solution** for natural language entry + professional reporting + educational guidance, creating a unique and valuable product in the market.

---

**Next Steps:**

1. Review and approve this specification
2. Begin Phase 1 implementation (Core Commands)
3. Set up testing infrastructure for command emulation
4. Plan user testing for command interface and educational content
5. Design mobile-optimized command interface
