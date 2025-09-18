import {
  LedgerTemplate,
  AccountDefinition,
  RuleDefinition,
} from "@/lib/ledger/templates";

export interface LedgerFile {
  path: string;
  content: string;
}

export interface LedgerStructure {
  files: LedgerFile[];
  mainJournalIncludes: string[];
}

export function generateLedgerStructure(
  template: LedgerTemplate
): LedgerStructure {
  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format

  const files: LedgerFile[] = [
    generateMainJournal(),
    generateAccountsJournal(template.accounts),
    generateMonthlyJournal(currentMonth),
    generateBaseRules(template.rules),
    generateTemplateRules(template),
    generateUserRules(),
    generateLearnedRules(),
  ];

  const mainJournalIncludes = [
    "accounts.journal",
    `journals/${currentMonth}.journal`,
  ];

  return {
    files,
    mainJournalIncludes,
  };
}

function generateMainJournal(): LedgerFile {
  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7);

  return {
    path: "main.journal",
    content: `; Ledger Entry — main journal file
; This file includes all other journal files
; Generated on ${currentDate.toISOString().split("T")[0]}

!include accounts.journal
!include journals/${currentMonth}.journal
`,
  };
}

function generateAccountsJournal(accounts: AccountDefinition[]): LedgerFile {
  const accountLines = accounts
    .map((account) => {
      return `account ${account.name}`;
    })
    .join("\n");

  const aliasLines = accounts
    .filter((account) => account.aliases && account.aliases.length > 0)
    .map((account) =>
      account
        .aliases!.map((alias) => `alias ${alias} = ${account.name}`)
        .join("\n")
    )
    .join("\n");

  return {
    path: "accounts.journal",
    content: `; Chart of Accounts
; Generated automatically from template

${accountLines}

; Account aliases for easier reference
${aliasLines}
`,
  };
}

function generateMonthlyJournal(month: string): LedgerFile {
  return {
    path: `journals/${month}.journal`,
    content: `; Monthly transaction entries for ${month}
; Add your transactions here

; Example transaction:
; ${new Date().toISOString().split("T")[0]} Sample Transaction
;     Personal:Expenses:Food:Coffee           5.00 USD
;     Personal:Assets:Bank:Checking          -5.00 USD
`,
  };
}

function generateBaseRules(rules: RuleDefinition): LedgerFile {
  return {
    path: "rules/00-base.json",
    content: JSON.stringify(
      {
        version: "1.0",
        defaults: rules.defaults,
        items: [],
        merchants: [],
        payments: [],
      },
      null,
      2
    ),
  };
}

function generateTemplateRules(template: LedgerTemplate): LedgerFile {
  return {
    path: "rules/10-templates.json",
    content: JSON.stringify(
      {
        version: "1.0",
        template: template.id,
        defaults: template.rules.defaults,
        items: template.rules.items,
        merchants: template.rules.merchants,
        payments: template.rules.payments,
      },
      null,
      2
    ),
  };
}

function generateUserRules(): LedgerFile {
  return {
    path: "rules/20-user.json",
    content: JSON.stringify(
      {
        version: "1.0",
        defaults: {},
        items: [],
        merchants: [],
        payments: [],
      },
      null,
      2
    ),
  };
}

function generateLearnedRules(): LedgerFile {
  return {
    path: "rules/30-learned.json",
    content: JSON.stringify(
      {
        version: "1.0",
        defaults: {},
        items: [],
        merchants: [],
        payments: [],
      },
      null,
      2
    ),
  };
}

export function generateSampleTransaction(
  template: LedgerTemplate,
  input: string
): string {
  // This is a simplified version - in a real implementation, you'd have
  // a more sophisticated NLP parser that uses the rules
  const today = new Date().toISOString().split("T")[0];
  const parts = input.trim().split(/\s+/);

  if (parts.length < 2) {
    return `; Invalid input: ${input}`;
  }

  const amount = parts[parts.length - 1];
  const description = parts.slice(0, -1).join(" ");

  // Simple pattern matching based on the template rules
  let debitAccount = template.rules.defaults.fallbackCredit; // This should be a debit account
  const creditAccount = template.rules.defaults.fallbackCredit;

  // Find matching item rules
  for (const item of template.rules.items) {
    if (new RegExp(item.pattern).test(description)) {
      debitAccount = item.debit;
      break;
    }
  }

  // Find matching merchant rules
  for (const merchant of template.rules.merchants) {
    if (new RegExp(merchant.pattern).test(description)) {
      debitAccount = merchant.defaultDebit;
      break;
    }
  }

  return `${today} ${description}
    ${debitAccount.padEnd(40)} ${amount} ${template.currency}
    ${creditAccount.padEnd(40)} -${amount} ${template.currency}`;
}
