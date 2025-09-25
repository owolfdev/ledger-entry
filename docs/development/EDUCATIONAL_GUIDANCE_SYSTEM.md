# **Educational Guidance System — Technical Specification**

**Owner:** OWolf / Ledger Entry  
**Status:** Design Phase  
**Scope:** Comprehensive educational guidance system that teaches double-entry bookkeeping, chart of accounts design, and Ledger CLI concepts through contextual help, rule explanations, and progressive learning.

---

## **1. Objectives**

- **Teach double-entry bookkeeping fundamentals** through real-world examples and explanations
- **Guide users in proper chart of accounts design** with hierarchical account structures
- **Educate users about Ledger CLI concepts** and best practices
- **Provide comprehensive accounting and bookkeeping education** from basics to advanced concepts
- **Teach practical business accounting skills** including tax implications and compliance
- **Provide contextual help** that appears when users need it most
- **Build user confidence** in accounting principles through progressive learning
- **Maintain system simplicity** while adding educational depth

---

## **2. Core Architecture Overview**

### **Components**

- **Enhanced Rules Engine**: Rules with educational explanations and accounting concepts
- **Contextual Help System**: Smart help that triggers based on user actions
- **Validation Guidance**: Educational error messages and suggestions
- **Progressive Learning**: Content that builds understanding over time
- **Interactive Tutorials**: Guided learning experiences for key concepts
- **Accounting Fundamentals**: Core accounting principles and bookkeeping basics
- **Business Accounting**: Practical business scenarios and tax implications

### **Data Flow**

```
User Action → Intent Detection → Rule Application → Educational Content → User Learning
```

---

## **3. Enhanced Rules Engine with Education**

### **3.1 Rule Schema Enhancement**

**Current Rule Structure:**

```json
{
  "pattern": "coffee|latte",
  "debit": "Personal:Expenses:Food:Coffee",
  "priority": 10
}
```

**Enhanced Rule Structure:**

```json
{
  "pattern": "coffee|latte",
  "debit": "Personal:Expenses:Food:Coffee",
  "priority": 10,
  "explanation": {
    "short": "Coffee purchases are food expenses",
    "detailed": "When you buy coffee, we record it as a food expense. This increases your food expenses (debit) and decreases your cash (credit).",
    "accountingConcept": "Expenses reduce net worth and are recorded as debits",
    "hierarchy": "Food > Coffee allows you to track both total food spending and coffee-specific costs",
    "examples": [
      "coffee 5 Starbucks → Expenses:Food:Coffee",
      "latte 6 Coffee Shop → Expenses:Food:Coffee"
    ],
    "relatedConcepts": ["Expenses", "Food Categories", "Account Hierarchy"],
    "ledgerCli": {
      "reporting": "ledger bal ^Expenses:Food:Coffee",
      "explanation": "This command shows your total coffee spending over time"
    }
  }
}
```

### **3.2 Account Type Definitions**

**Account Type Schema:**

```json
{
  "accountTypes": {
    "Assets": {
      "normalBalance": "debit",
      "explanation": "Assets are things you own that have value. They normally have debit balances.",
      "examples": ["Cash", "Bank Accounts", "Inventory", "Equipment"],
      "ledgerCli": "ledger bal ^Assets"
    },
    "Liabilities": {
      "normalBalance": "credit",
      "explanation": "Liabilities are debts you owe. They normally have credit balances.",
      "examples": ["Credit Cards", "Loans", "Accounts Payable"],
      "ledgerCli": "ledger bal ^Liabilities"
    },
    "Expenses": {
      "normalBalance": "debit",
      "explanation": "Expenses reduce your net worth. They are recorded as debits.",
      "examples": ["Food", "Rent", "Utilities", "Marketing"],
      "ledgerCli": "ledger bal ^Expenses"
    },
    "Income": {
      "normalBalance": "credit",
      "explanation": "Income increases your net worth. It is recorded as credits.",
      "examples": ["Sales", "Salary", "Interest", "Rental Income"],
      "ledgerCli": "ledger bal ^Income"
    }
  }
}
```

---

## **4. Contextual Help System**

### **4.1 Help Triggers**

**Smart Help Based on User Actions:**

```typescript
interface HelpTrigger {
  condition: string;
  help: HelpContent;
  priority: number;
}

const helpTriggers: HelpTrigger[] = [
  {
    condition: "user_creates_flat_account",
    help: {
      title: "Consider Hierarchical Accounts",
      explanation:
        "Instead of 'Expenses:Apple', try 'Expenses:Food:Fruit:Apple'. This lets you track both total food spending and fruit-specific costs.",
      examples: [
        "Expenses:Food:Fruit:Apple",
        "Expenses:Food:Vegetables:Carrot",
        "Expenses:Transportation:Gas:Shell",
      ],
      benefits: [
        "Track total food spending",
        "Track fruit-specific spending",
        "Better reporting and analysis",
      ],
      ledgerCli: {
        commands: [
          "ledger bal ^Expenses:Food",
          "ledger bal ^Expenses:Food:Fruit",
          "ledger bal ^Expenses:Food:Fruit:Apple",
        ],
        explanation:
          "Hierarchical accounts let you run reports at any level of detail",
      },
    },
    priority: 1,
  },
  {
    condition: "user_enters_unbalanced_transaction",
    help: {
      title: "Transactions Must Balance",
      explanation:
        "Every transaction must have equal debits and credits. When you spend $10 on coffee, debit Expenses:Food:Coffee $10 and credit Assets:Bank $10.",
      examples: [
        "Debit Expenses:Food:Coffee $10, Credit Assets:Bank $10",
        "Debit Assets:Inventory $50, Credit Assets:Bank $50",
      ],
      accountingConcept:
        "This is the fundamental rule of double-entry bookkeeping",
      ledgerCli: {
        validation: "ledger validate",
        explanation: "Use this command to check if all transactions balance",
      },
    },
    priority: 1,
  },
  {
    condition: "user_uses_wrong_account_sign",
    help: {
      title: "Account Type and Signs",
      explanation:
        "Expense accounts normally have debit amounts (positive). Asset accounts like cash normally have credit amounts (negative) when you spend money.",
      examples: [
        "Buy coffee: Debit Expenses:Food:Coffee $5, Credit Assets:Bank $5",
        "Receive salary: Debit Assets:Bank $3000, Credit Income:Salary $3000",
      ],
      accountingConcept: "Debits and credits follow the accounting equation",
      ledgerCli: {
        commands: ["ledger bal ^Expenses", "ledger bal ^Assets"],
        explanation:
          "Expense balances should be positive, asset balances should be positive when you have money",
      },
    },
    priority: 2,
  },
];
```

### **4.2 Progressive Learning Content**

**Learning Levels:**

```typescript
interface LearningLevel {
  level: "beginner" | "intermediate" | "advanced";
  topics: LearningTopic[];
  prerequisites: string[];
}

interface LearningTopic {
  id: string;
  title: string;
  content: {
    concept: string;
    explanation: string;
    examples: string[];
    practice: string[];
    ledgerCli: {
      commands: string[];
      explanation: string;
    };
  };
}

const learningLevels: LearningLevel[] = [
  {
    level: "beginner",
    topics: [
      {
        id: "what-is-accounting",
        title: "What is Accounting?",
        content: {
          concept: "Accounting is the language of business",
          explanation:
            "Accounting tracks your financial activities and helps you understand where your money comes from and where it goes. It's essential for making informed business and personal decisions.",
          examples: [
            "Track income and expenses",
            "Monitor cash flow",
            "Prepare for taxes",
            "Make business decisions",
          ],
          practice: [
            "Start with personal expenses",
            "Track your daily spending",
            "Categorize your transactions",
          ],
          ledgerCli: {
            commands: ["ledger bal", "ledger reg"],
            explanation:
              "These basic commands show your account balances and transaction history.",
          },
        },
      },
      {
        id: "accounting-equation",
        title: "The Accounting Equation",
        content: {
          concept: "Assets = Liabilities + Equity",
          explanation:
            "This equation must always balance. When you buy something, you either use cash (reduce assets) or create debt (increase liabilities).",
          examples: [
            "Buy coffee with cash: Assets decrease, Expenses increase",
            "Buy coffee on credit: Liabilities increase, Expenses increase",
            "Receive salary: Assets increase, Equity increases",
          ],
          practice: [
            'Try entering: "coffee 5 Starbucks"',
            'Try entering: "salary 3000 company"',
            "Notice how the equation stays balanced",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Assets",
              "ledger bal ^Liabilities",
              "ledger bal ^Equity",
            ],
            explanation:
              "These commands show each side of the accounting equation. They should balance when you add them up.",
          },
        },
      },
      {
        id: "debits-credits",
        title: "Understanding Debits and Credits",
        content: {
          concept:
            "Debits and Credits are the foundation of double-entry bookkeeping",
          explanation:
            "Debits increase assets and expenses, credits increase liabilities and income. When you spend money, you debit an expense (increases expenses) and credit cash (decreases cash).",
          examples: [
            "Buy coffee: Debit Expenses:Food:Coffee, Credit Assets:Bank",
            "Receive salary: Debit Assets:Bank, Credit Income:Salary",
            "Pay rent: Debit Expenses:Housing:Rent, Credit Assets:Bank",
          ],
          practice: [
            'Try entering: "coffee 5 Starbucks"',
            'Try entering: "salary 3000 company"',
            'Try entering: "rent 1200 landlord"',
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Expenses",
              "ledger bal ^Assets",
              "ledger bal ^Income",
            ],
            explanation:
              "These commands show your total expenses, assets, and income. Notice how expenses and assets have positive balances (debits), while income has positive balances (credits).",
          },
        },
      },
      {
        id: "account-hierarchy",
        title: "Chart of Accounts Design",
        content: {
          concept:
            "A well-designed chart of accounts uses hierarchy for better reporting",
          explanation:
            "Instead of flat account names, use hierarchical structures like Expenses:Food:Fruit:Apple. This lets you run reports at different levels of detail.",
          examples: [
            "Expenses:Food:Fruit:Apple (specific)",
            "Expenses:Food:Fruit (category)",
            "Expenses:Food (major category)",
            "Expenses (total)",
          ],
          practice: [
            "Create account: Expenses:Food:Fruit:Apple",
            "Create account: Expenses:Transportation:Gas:Shell",
            "Create account: Assets:Bank:Checking:Primary",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Expenses:Food:Fruit",
              "ledger bal ^Expenses:Food",
              "ledger bal ^Expenses",
            ],
            explanation:
              "Hierarchical accounts let you drill down or roll up your reporting as needed.",
          },
        },
      },
    ],
    prerequisites: [],
  },
  {
    level: "intermediate",
    topics: [
      {
        id: "business-vs-personal",
        title: "Business vs Personal Expenses",
        content: {
          concept:
            "Separate business and personal expenses for tax and reporting purposes",
          explanation:
            "Business expenses are tax-deductible and help you understand your business profitability. Personal expenses are not deductible but important for personal budgeting.",
          examples: [
            "Business: Expenses:Marketing:GoogleAds (tax-deductible)",
            "Personal: Expenses:Food:Coffee (not tax-deductible)",
            "Business: Expenses:Office:Supplies (tax-deductible)",
            "Personal: Expenses:Entertainment:Movies (not tax-deductible)",
          ],
          practice: [
            "Create separate account structures for business and personal",
            "Enter business expenses with proper categorization",
            "Track personal expenses separately",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Business:Expenses",
              "ledger bal ^Personal:Expenses",
              "ledger bal ^Business:Income",
            ],
            explanation:
              "These commands help you analyze business profitability and personal spending separately.",
          },
        },
      },
      {
        id: "cash-vs-accrual",
        title: "Cash vs Accrual Accounting",
        content: {
          concept: "Choose the right accounting method for your business needs",
          explanation:
            "Cash accounting records transactions when money changes hands. Accrual accounting records transactions when they occur, regardless of payment timing.",
          examples: [
            "Cash: Record income when you receive payment",
            "Accrual: Record income when you complete the work",
            "Cash: Record expenses when you pay the bill",
            "Accrual: Record expenses when you receive the service",
          ],
          practice: [
            "Understand which method your business should use",
            "Set up accounts for both cash and accrual scenarios",
            "Track receivables and payables if using accrual",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Assets:Receivables",
              "ledger bal ^Liabilities:Payables",
              "ledger reg ^Income --date '2024-01'",
            ],
            explanation:
              "These commands help you track money owed to you and money you owe to others.",
          },
        },
      },
      {
        id: "reconciliation",
        title: "Bank Reconciliation",
        content: {
          concept:
            "Reconciliation ensures your books match your bank statements",
          explanation:
            "Regular reconciliation helps you catch errors, find missing transactions, and maintain accurate records.",
          examples: [
            "Bank shows $1,000, ledger shows $950 → find $50 difference",
            "Check for unrecorded transactions",
            "Look for bank fees or interest",
          ],
          practice: [
            "Run: ledger bal ^Assets:Bank",
            "Compare with bank statement",
            "Find and record missing transactions",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Assets:Bank",
              'ledger reg ^Assets:Bank --date "2024-01"',
              "ledger validate",
            ],
            explanation:
              "Use these commands to verify your bank account balance and transaction history.",
          },
        },
      },
      {
        id: "financial-statements",
        title: "Understanding Financial Statements",
        content: {
          concept: "Financial statements tell the story of your business",
          explanation:
            "The three main financial statements are the Balance Sheet (what you own/owe), Income Statement (profit/loss), and Cash Flow Statement (cash movements).",
          examples: [
            "Balance Sheet: Assets = Liabilities + Equity",
            "Income Statement: Revenue - Expenses = Net Income",
            "Cash Flow: Operating + Investing + Financing = Net Cash Flow",
          ],
          practice: [
            "Generate monthly balance sheets",
            "Create quarterly income statements",
            "Track cash flow patterns",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Assets ^Liabilities ^Equity",
              "ledger bal ^Income ^Expenses",
              "ledger reg ^Assets:Bank --date '2024-01'",
            ],
            explanation:
              "These commands help you generate the basic components of financial statements.",
          },
        },
      },
    ],
    prerequisites: [
      "what-is-accounting",
      "accounting-equation",
      "debits-credits",
      "account-hierarchy",
    ],
  },
  {
    level: "advanced",
    topics: [
      {
        id: "inventory-management",
        title: "Inventory Management",
        content: {
          concept: "Track inventory as an asset until sold",
          explanation:
            "Inventory is a current asset that represents goods you own but haven't sold yet. When you sell inventory, it becomes a cost of goods sold (COGS).",
          examples: [
            "Buy inventory: Debit Assets:Inventory, Credit Assets:Bank",
            "Sell inventory: Debit COGS:Inventory, Credit Assets:Inventory",
            "Inventory adjustment: Debit/Credit Assets:Inventory",
          ],
          practice: [
            "Set up inventory tracking accounts",
            "Record inventory purchases and sales",
            "Perform regular inventory counts",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Assets:Inventory",
              "ledger bal ^COGS:Inventory",
              "ledger reg ^Assets:Inventory --date '2024-01'",
            ],
            explanation:
              "These commands help you track inventory levels and cost of goods sold.",
          },
        },
      },
      {
        id: "depreciation",
        title: "Asset Depreciation",
        content: {
          concept: "Spread the cost of long-term assets over their useful life",
          explanation:
            "Depreciation allocates the cost of assets (like equipment) over their useful life. This matches the expense with the revenue the asset helps generate.",
          examples: [
            "Buy equipment: Debit Assets:Equipment, Credit Assets:Bank",
            "Monthly depreciation: Debit Expenses:Depreciation, Credit Assets:AccumulatedDepreciation",
            "Equipment disposal: Remove asset and accumulated depreciation",
          ],
          practice: [
            "Set up depreciation schedules",
            "Record monthly depreciation entries",
            "Track asset values over time",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Assets:Equipment",
              "ledger bal ^Assets:AccumulatedDepreciation",
              "ledger bal ^Expenses:Depreciation",
            ],
            explanation:
              "These commands help you track asset values and depreciation expenses.",
          },
        },
      },
      {
        id: "multi-currency",
        title: "Multi-Currency Transactions",
        content: {
          concept: "Handle transactions in different currencies",
          explanation:
            "When dealing with multiple currencies, you need to track both the original currency and the functional currency for reporting purposes.",
          examples: [
            "Buy USD item: Debit Expenses:Shopping $100 USD, Credit Assets:Bank $100 USD",
            "Currency conversion: Record exchange rate differences",
            "Revaluation: Adjust currency values at period end",
          ],
          practice: [
            "Set up multi-currency accounts",
            "Record transactions in original currency",
            "Handle currency conversion and revaluation",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Assets:Bank --currency USD",
              "ledger bal ^Expenses --currency THB",
              "ledger reg ^Assets:Bank --date '2024-01'",
            ],
            explanation:
              "These commands help you track balances in different currencies and analyze exchange rate impacts.",
          },
        },
      },
      {
        id: "tax-implications",
        title: "Tax Implications and Compliance",
        content: {
          concept: "Understand what expenses are tax-deductible",
          explanation:
            "Different types of expenses have different tax treatments. Business expenses are generally deductible, while personal expenses are not. Some expenses have special rules.",
          examples: [
            "Business meals: 50% deductible in many jurisdictions",
            "Home office: Proportional deduction based on business use",
            "Equipment: May be deductible or require depreciation",
            "Personal expenses: Generally not deductible",
          ],
          practice: [
            "Categorize expenses by tax treatment",
            "Track deductible vs non-deductible expenses",
            "Maintain proper documentation",
          ],
          ledgerCli: {
            commands: [
              "ledger bal ^Expenses:Business",
              "ledger bal ^Expenses:Personal",
              "ledger reg ^Expenses --date '2024-01'",
            ],
            explanation:
              "These commands help you separate deductible and non-deductible expenses for tax preparation.",
          },
        },
      },
    ],
    prerequisites: [
      "business-vs-personal",
      "cash-vs-accrual",
      "reconciliation",
      "financial-statements",
    ],
  },
];
```

---

## **5. Accounting Fundamentals System**

### **5.1 Core Accounting Concepts**

**Accounting Principles Database:**

```typescript
interface AccountingConcept {
  id: string;
  title: string;
  concept: string;
  explanation: string;
  examples: string[];
  practice: string[];
  ledgerCli: {
    commands: string[];
    explanation: string;
  };
  relatedConcepts: string[];
}

const accountingFundamentals: AccountingConcept[] = [
  {
    id: "accounting-equation",
    title: "The Accounting Equation",
    concept: "Assets = Liabilities + Equity",
    explanation:
      "This fundamental equation must always balance. It shows that everything you own (assets) is either owed to others (liabilities) or owned by you (equity).",
    examples: [
      "Buy equipment with cash: Assets stay the same, but composition changes",
      "Take out a loan: Assets increase, Liabilities increase",
      "Owner invests money: Assets increase, Equity increases",
    ],
    practice: [
      "Analyze every transaction's effect on the equation",
      "Ensure the equation always balances",
      "Understand how different transactions affect each component",
    ],
    ledgerCli: {
      commands: [
        "ledger bal ^Assets",
        "ledger bal ^Liabilities",
        "ledger bal ^Equity",
      ],
      explanation:
        "These commands show each component of the accounting equation. Assets should equal Liabilities + Equity.",
    },
    relatedConcepts: ["debits-credits", "double-entry"],
  },
  {
    id: "double-entry-principle",
    title: "Double-Entry Bookkeeping",
    concept: "Every transaction affects at least two accounts",
    explanation:
      "This principle ensures your books always balance and helps catch errors. Every debit must have a corresponding credit.",
    examples: [
      "Spend cash: Debit Expense, Credit Asset",
      "Receive payment: Debit Asset, Credit Income",
      "Buy on credit: Debit Asset, Credit Liability",
    ],
    practice: [
      "Always identify both sides of every transaction",
      "Ensure debits equal credits",
      "Use the accounting equation to verify balance",
    ],
    ledgerCli: {
      commands: ["ledger validate"],
      explanation:
        "This command checks that all transactions balance and follow double-entry principles.",
    },
    relatedConcepts: ["accounting-equation", "debits-credits"],
  },
];
```

### **5.2 Business Accounting Concepts**

**Business-Specific Guidance:**

```typescript
interface BusinessConcept {
  id: string;
  title: string;
  concept: string;
  explanation: string;
  examples: string[];
  taxImplications: string;
  practice: string[];
  ledgerCli: {
    commands: string[];
    explanation: string;
  };
}

const businessAccounting: BusinessConcept[] = [
  {
    id: "business-expense-classification",
    title: "Business Expense Classification",
    concept: "Categorize expenses for tax and reporting purposes",
    explanation:
      "Different types of business expenses have different tax treatments and help you understand your business performance.",
    examples: [
      "Marketing expenses: Tax-deductible, helps grow business",
      "Office supplies: Tax-deductible, necessary for operations",
      "Meals and entertainment: Often 50% deductible",
      "Personal expenses: Not deductible, separate from business",
    ],
    taxImplications:
      "Proper classification helps maximize deductions and ensures compliance with tax regulations.",
    practice: [
      "Separate business and personal expenses",
      "Use consistent categorization",
      "Keep detailed records for tax purposes",
    ],
    ledgerCli: {
      commands: [
        "ledger bal ^Business:Expenses",
        "ledger bal ^Business:Expenses:Marketing",
        "ledger bal ^Business:Expenses:Office",
      ],
      explanation:
        "These commands help you analyze business expenses by category for tax preparation and performance analysis.",
    },
  },
  {
    id: "revenue-recognition",
    title: "Revenue Recognition",
    concept: "Record revenue when earned, not when received",
    explanation:
      "Revenue should be recognized when you provide goods or services, regardless of when payment is received.",
    examples: [
      "Complete a project: Record revenue when work is done",
      "Sell a product: Record revenue when product is delivered",
      "Receive advance payment: Record as liability until work is done",
    ],
    taxImplications:
      "Proper revenue recognition ensures accurate tax reporting and business performance measurement.",
    practice: [
      "Track work completion vs payment timing",
      "Use accounts receivable for unpaid invoices",
      "Separate cash flow from revenue recognition",
    ],
    ledgerCli: {
      commands: [
        "ledger bal ^Business:Income",
        "ledger bal ^Assets:Receivables",
        "ledger reg ^Business:Income --date '2024-01'",
      ],
      explanation:
        "These commands help you track revenue and outstanding payments.",
    },
  },
];
```

### **5.3 Tax and Compliance Guidance**

**Tax-Specific Educational Content:**

```typescript
interface TaxGuidance {
  id: string;
  title: string;
  concept: string;
  explanation: string;
  examples: string[];
  compliance: string;
  practice: string[];
  ledgerCli: {
    commands: string[];
    explanation: string;
  };
}

const taxGuidance: TaxGuidance[] = [
  {
    id: "deductible-expenses",
    title: "Deductible Business Expenses",
    concept: "Understand what expenses reduce your taxable income",
    explanation:
      "Business expenses that are ordinary and necessary for your business are generally tax-deductible.",
    examples: [
      "Office rent: Fully deductible",
      "Business meals: Often 50% deductible",
      "Equipment: May be deductible or require depreciation",
      "Home office: Proportional to business use",
    ],
    compliance:
      "Keep detailed records and receipts for all business expenses. Consult a tax professional for complex situations.",
    practice: [
      "Categorize expenses by tax treatment",
      "Maintain detailed expense records",
      "Separate business and personal expenses",
    ],
    ledgerCli: {
      commands: [
        "ledger bal ^Business:Expenses:Deductible",
        "ledger bal ^Business:Expenses:NonDeductible",
        "ledger reg ^Business:Expenses --date '2024-01'",
      ],
      explanation:
        "These commands help you prepare for tax filing by separating deductible and non-deductible expenses.",
    },
  },
];
```

---

## **6. Validation Guidance System**

### **5.1 Enhanced Error Messages**

**Educational Error Schema:**

```typescript
interface EducationalError {
  type: string;
  message: string;
  explanation: string;
  suggestion: string;
  accountingConcept: string;
  example: string;
  ledgerCli?: {
    command: string;
    explanation: string;
  };
}

const educationalErrors: EducationalError[] = [
  {
    type: "unbalanced-transaction",
    message: "Transaction is unbalanced: debits ($100.00) ≠ credits ($95.00)",
    explanation:
      "Every transaction must have equal debits and credits. This is the fundamental rule of double-entry bookkeeping.",
    suggestion: "Check your amounts and ensure debits equal credits.",
    accountingConcept: "The accounting equation: Assets = Liabilities + Equity",
    example:
      "Buy coffee $5: Debit Expenses:Food:Coffee $5, Credit Assets:Bank $5",
    ledgerCli: {
      command: "ledger validate",
      explanation: "This command checks if all transactions balance correctly.",
    },
  },
  {
    type: "wrong-account-sign",
    message: "Expense accounts should have debit amounts (positive)",
    explanation:
      "Expense accounts normally have debit balances. When you spend money, you increase (debit) the expense account.",
    suggestion: "Make sure expense amounts are positive (debits).",
    accountingConcept: "Expenses reduce net worth and are recorded as debits",
    example: "Expenses:Food:Coffee $5.00 (not -$5.00)",
    ledgerCli: {
      command: "ledger bal ^Expenses",
      explanation: "Expense balances should be positive numbers.",
    },
  },
  {
    type: "flat-account-structure",
    message: "Consider using hierarchical account structure",
    explanation:
      "Hierarchical accounts like Expenses:Food:Fruit:Apple provide better reporting capabilities than flat structures.",
    suggestion: "Use Expenses:Food:Fruit:Apple instead of Expenses:Apple",
    accountingConcept:
      "Chart of accounts design affects reporting and analysis",
    example: "Expenses:Food:Fruit:Apple, Expenses:Food:Vegetables:Carrot",
    ledgerCli: {
      command: "ledger bal ^Expenses:Food:Fruit",
      explanation:
        "Hierarchical accounts let you run reports at any level of detail.",
    },
  },
];
```

### **5.2 Smart Suggestions**

**Account Structure Suggestions:**

```typescript
interface AccountSuggestion {
  item: string;
  suggestedPath: string;
  reason: string;
  alternatives: string[];
  reportingBenefits: string[];
  ledgerCli: {
    commands: string[];
    explanation: string;
  };
}

function getAccountSuggestion(item: string): AccountSuggestion {
  const foodCategories = {
    fruit: ["apple", "banana", "orange", "grape", "strawberry"],
    vegetables: ["carrot", "lettuce", "tomato", "onion", "potato"],
    dairy: ["milk", "cheese", "yogurt", "butter", "cream"],
    meat: ["chicken", "beef", "pork", "fish", "lamb"],
    grains: ["bread", "rice", "pasta", "cereal", "flour"],
  };

  for (const [category, items] of Object.entries(foodCategories)) {
    if (items.some((food) => item.toLowerCase().includes(food))) {
      return {
        item,
        suggestedPath: `Personal:Expenses:Food:${category}:${item}`,
        reason: `${item} is a ${category}, so it should go under Expenses:Food:${category}`,
        alternatives: [
          `Personal:Expenses:Food:${item}`,
          `Personal:Expenses:${category}:${item}`,
        ],
        reportingBenefits: [
          "Track total food spending",
          "Track total fruit spending",
          "Track apple-specific spending",
          "Compare spending across food categories",
        ],
        ledgerCli: {
          commands: [
            `ledger bal ^Expenses:Food:${category}`,
            `ledger bal ^Expenses:Food`,
            `ledger bal ^Expenses:Food:${category}:${item}`,
          ],
          explanation:
            "Hierarchical accounts let you analyze spending at different levels of detail.",
        },
      };
    }
  }

  return {
    item,
    suggestedPath: `Personal:Expenses:Food:${item}`,
    reason: `${item} is a food item`,
    alternatives: [`Personal:Expenses:${item}`],
    reportingBenefits: ["Track total food spending"],
    ledgerCli: {
      commands: [
        `ledger bal ^Expenses:Food:${item}`,
        `ledger bal ^Expenses:Food`,
      ],
      explanation:
        "This structure allows you to track both individual items and total food spending.",
    },
  };
}
```

---

## **6. Interactive Tutorial System**

### **6.1 Guided Learning Experiences**

**Tutorial Structure:**

```typescript
interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  prerequisites: string[];
  estimatedTime: string;
}

interface TutorialStep {
  id: string;
  title: string;
  content: {
    explanation: string;
    example: string;
    practice: string;
    validation: string;
  };
  interactive: {
    type: "input" | "selection" | "drag-drop";
    prompt: string;
    expectedResponse: string;
    feedback: {
      correct: string;
      incorrect: string;
      hint: string;
    };
  };
}

const tutorials: Tutorial[] = [
  {
    id: "double-entry-basics",
    title: "Understanding Double-Entry Bookkeeping",
    description:
      "Learn the fundamental concepts of double-entry bookkeeping through hands-on examples.",
    estimatedTime: "10 minutes",
    prerequisites: [],
    steps: [
      {
        id: "what-is-double-entry",
        title: "What is Double-Entry Bookkeeping?",
        content: {
          explanation:
            "Double-entry bookkeeping means every transaction affects at least two accounts, and debits always equal credits.",
          example:
            "When you buy coffee for $5: Debit Expenses:Food:Coffee $5, Credit Assets:Bank $5",
          practice: 'Try entering: "coffee 5 Starbucks"',
          validation:
            "Check that the transaction balances: total debits = total credits",
        },
        interactive: {
          type: "input",
          prompt: "Enter a transaction for buying lunch for $12:",
          expectedResponse: "lunch 12",
          feedback: {
            correct:
              "Great! You created a balanced transaction. Notice how we debited the expense and credited your bank account.",
            incorrect:
              "Remember: every transaction needs both a debit and credit side.",
            hint: "Think about what account increases (expense) and what account decreases (bank).",
          },
        },
      },
    ],
  },
];
```

### **6.2 Contextual Learning Triggers**

**Learning Moments:**

```typescript
interface LearningMoment {
  trigger: string;
  content: {
    title: string;
    explanation: string;
    example: string;
    practice: string;
  };
  dismissible: boolean;
  priority: number;
}

const learningMoments: LearningMoment[] = [
  {
    trigger: "first_transaction",
    content: {
      title: "🎉 Your First Transaction!",
      explanation:
        "You just created your first double-entry transaction. Notice how we debited your expense account and credited your bank account.",
      example:
        "coffee 5 Starbucks → Debit Expenses:Food:Coffee $5, Credit Assets:Bank $5",
      practice: 'Try entering another transaction: "lunch 15 restaurant"',
    },
    dismissible: true,
    priority: 1,
  },
  {
    trigger: "unbalanced_transaction",
    content: {
      title: "⚖️ Transaction Must Balance",
      explanation:
        "Every transaction must have equal debits and credits. This is the fundamental rule of double-entry bookkeeping.",
      example:
        "Buy coffee $5: Debit Expenses:Food:Coffee $5, Credit Assets:Bank $5",
      practice: "Fix the transaction by ensuring debits equal credits",
    },
    dismissible: false,
    priority: 1,
  },
];
```

---

## **7. Implementation Phases**

### **Phase 1: Enhanced Rules Engine (Week 1-2)**

**Deliverables:**

- Enhanced rule schema with explanations
- Account type definitions
- Rule explanation display system
- Basic educational content integration
- Core accounting concepts integration

**Files to Create/Modify:**

```
src/lib/commands/natural-language/
├── enhanced-rules-engine.ts     ← Enhanced rules with explanations
├── account-types.ts             ← Account type definitions
├── educational-content.ts       ← Educational content storage
└── rule-explanation-display.ts  ← Display system for explanations

src/lib/education/
├── accounting-fundamentals.ts   ← Core accounting concepts
├── business-accounting.ts       ← Business-specific concepts
└── tax-guidance.ts              ← Tax and compliance guidance
```

### **Phase 2: Contextual Help System (Week 3)**

**Deliverables:**

- Help trigger system
- Contextual help content
- Progressive learning framework
- Smart suggestion system

**Files to Create/Modify:**

```
src/lib/guidance/
├── contextual-help.ts           ← Help trigger system
├── learning-levels.ts           ← Progressive learning content
├── smart-suggestions.ts         ← Account structure suggestions
└── help-display.ts              ← Help display components
```

### **Phase 3: Validation Guidance (Week 4)**

**Deliverables:**

- Educational error messages
- Enhanced validation system
- Smart error suggestions
- Interactive error resolution

**Files to Create/Modify:**

```
src/lib/validation/
├── educational-errors.ts        ← Educational error definitions
├── enhanced-validator.ts        ← Enhanced validation logic
├── error-suggestions.ts         ← Smart error suggestions
└── validation-display.ts        ← Error display components
```

### **Phase 4: Interactive Tutorials (Week 5-6)**

**Deliverables:**

- Tutorial system
- Interactive learning experiences
- Learning moment triggers
- Progress tracking

**Files to Create/Modify:**

```
src/components/tutorials/
├── tutorial-system.tsx          ← Tutorial framework
├── interactive-steps.tsx        ← Interactive tutorial steps
├── learning-moments.tsx         ← Contextual learning triggers
└── progress-tracking.tsx        ← Learning progress tracking
```

---

## **8. User Experience Flow**

### **8.1 First-Time User Experience**

```
1. User enters first transaction: "coffee 5 Starbucks"
2. System shows: "🎉 Your First Transaction! Let me explain what just happened..."
3. Display: Rule explanation, accounting concept, Ledger CLI command
4. User learns: Double-entry basics, account hierarchy, reporting commands
5. System suggests: "Try entering: lunch 15 restaurant"
6. User continues with guided learning
```

### **8.2 Experienced User Experience**

```
1. User enters transaction: "apple 300 grocery"
2. System shows: "✅ Applied rule: 'Apples are fruit expenses'"
3. Display: Brief explanation, account hierarchy benefits
4. User sees: Ledger CLI reporting commands
5. System continues with minimal interruption
```

### **8.3 Error Resolution Experience**

```
1. User enters unbalanced transaction
2. System shows: "⚖️ Transaction Must Balance"
3. Display: Educational explanation, accounting concept, example
4. System suggests: Specific fix with explanation
5. User learns: Why transactions must balance, how to fix them
6. System shows: Ledger CLI validation command
```

---

## **9. Educational Content Guidelines**

### **9.1 Content Principles**

- **Progressive Disclosure**: Start simple, add complexity gradually
- **Contextual Relevance**: Show help when users need it most
- **Practical Examples**: Use real-world scenarios users can relate to
- **Ledger CLI Integration**: Always show relevant commands and explain their purpose
- **Positive Reinforcement**: Celebrate learning moments and progress

### **9.2 Tone and Style**

- **Encouraging**: "Great job!" instead of "That's correct"
- **Explanatory**: "Here's why this works..." instead of "This is how it works"
- **Practical**: Focus on real-world applications
- **Accessible**: Avoid jargon, explain accounting terms
- **Interactive**: Encourage experimentation and learning

---

## **10. Success Metrics**

### **10.1 Learning Effectiveness**

- **User Engagement**: Time spent with educational content
- **Error Reduction**: Decrease in validation errors over time
- **Feature Adoption**: Increased use of advanced features
- **User Confidence**: Self-reported confidence in accounting concepts

### **10.2 System Performance**

- **Help Relevance**: User satisfaction with contextual help
- **Content Usage**: Most accessed educational content
- **Tutorial Completion**: Percentage of users completing tutorials
- **Support Reduction**: Decrease in user support requests

---

## **11. Future Enhancements**

### **11.1 Advanced Features**

- **Personalized Learning Paths**: Customized content based on user behavior
- **Gamification**: Points, badges, and achievements for learning milestones
- **Community Features**: User-generated educational content and examples
- **Integration**: Connect with accounting courses and certifications

### **11.2 Content Expansion**

- **Industry-Specific Content**: Tailored guidance for different business types
- **Advanced Topics**: Complex accounting scenarios and edge cases
- **Multimedia Content**: Videos, diagrams, and interactive examples
- **Localization**: Educational content in multiple languages

---

## **12. Technical Considerations**

### **12.1 Performance**

- **Lazy Loading**: Load educational content on demand
- **Caching**: Cache frequently accessed content
- **Progressive Enhancement**: Core functionality works without educational features
- **Minimal Overhead**: Educational features don't impact core performance

### **12.2 Maintainability**

- **Modular Design**: Each educational component is independent
- **Content Management**: Easy to update educational content without code changes
- **Version Control**: Track changes to educational content
- **Testing**: Comprehensive testing of educational features

---

## **13. Comprehensive Accounting Education**

### **13.1 Educational Value Proposition**

The Educational Guidance System transforms Ledger Entry from a simple natural language interface into a **comprehensive accounting education platform** that teaches users:

**Core Accounting Skills:**

- ✅ **Accounting fundamentals** - The accounting equation, debits and credits
- ✅ **Double-entry bookkeeping** - How every transaction affects multiple accounts
- ✅ **Chart of accounts design** - Hierarchical account structures for better reporting
- ✅ **Financial statement understanding** - Balance sheets, income statements, cash flow

**Business Accounting Skills:**

- ✅ **Business vs personal expense separation** - Tax implications and compliance
- ✅ **Revenue recognition** - When to record income and expenses
- ✅ **Cash vs accrual accounting** - Choosing the right method for your business
- ✅ **Bank reconciliation** - Matching books to bank statements

**Advanced Concepts:**

- ✅ **Inventory management** - Tracking goods as assets until sold
- ✅ **Asset depreciation** - Spreading costs over useful life
- ✅ **Multi-currency transactions** - Handling foreign currencies
- ✅ **Tax compliance** - Understanding deductible expenses and tax implications

**Ledger CLI Proficiency:**

- ✅ **Command usage** - Balance, register, validation commands
- ✅ **Reporting techniques** - Generating financial reports locally
- ✅ **Data analysis** - Using Ledger CLI for business insights

### **13.2 Competitive Differentiation**

**What Sets This Apart:**

- 🎯 **Educational Focus** - Teaches real accounting skills, not just data entry
- 🎯 **Progressive Learning** - Builds understanding from basics to advanced concepts
- 🎯 **Practical Application** - Learn by doing with real-world examples
- 🎯 **Professional Skills** - Users develop transferable accounting knowledge
- 🎯 **Tax Compliance** - Helps users understand tax implications and deductions

**Market Position:**

- **vs Simple Expense Trackers**: Teaches proper accounting principles
- **vs Complex Accounting Software**: Accessible learning with powerful backend
- **vs Ledger CLI Alone**: Makes double-entry bookkeeping accessible to everyone
- **vs Accounting Courses**: Learn through practical application, not just theory

## **14. Conclusion**

The Educational Guidance System transforms Ledger Entry from a simple natural language interface into a **comprehensive accounting education platform** that teaches users proper accounting principles while they use the system. By combining contextual help, progressive learning, practical examples, and comprehensive accounting education, users will not only use the system effectively but also develop genuine understanding of:

- **Double-entry bookkeeping fundamentals**
- **Chart of accounts design and hierarchy**
- **Business accounting principles**
- **Tax implications and compliance**
- **Ledger CLI usage and reporting**
- **Financial statement generation and analysis**

This system positions Ledger Entry as the **premier educational tool for learning accounting through practical application**, setting it apart from competitors and creating lasting value for users who develop real, transferable accounting skills.

---

**Next Steps:**

1. Review and approve this specification
2. Begin Phase 1 implementation (Enhanced Rules Engine)
3. Create detailed technical specifications for each component
4. Develop testing strategies for educational content effectiveness
5. Plan user testing and feedback collection for educational features
