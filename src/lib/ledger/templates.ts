export interface LedgerTemplate {
  id: string;
  name: string;
  description: string;
  currency: string;
  locale: string;
  accounts: AccountDefinition[];
  rules: RuleDefinition;
  sampleTransaction: string;
}

export interface AccountDefinition {
  name: string;
  type: "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses";
  subType?: string;
  aliases?: string[];
}

export interface RuleDefinition {
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
}

export interface RuleMerchant {
  pattern: string;
  defaultDebit: string;
}

export interface RulePayment {
  pattern: string;
  credit: string;
}

export const LEDGER_TEMPLATES: LedgerTemplate[] = [
  {
    id: "th-thb",
    name: "Thailand (THB)",
    description:
      "Personal finance template for Thailand with common Thai banks and merchants",
    currency: "THB",
    locale: "th-TH",
    accounts: [
      {
        name: "Personal:Assets:Bank:KBank:Checking",
        type: "Assets",
        subType: "Bank",
        aliases: ["kbank", "kasikorn"],
      },
      {
        name: "Personal:Assets:Bank:SCB:Checking",
        type: "Assets",
        subType: "Bank",
        aliases: ["scb", "siam"],
      },
      {
        name: "Personal:Assets:Bank:Bangkok:Checking",
        type: "Assets",
        subType: "Bank",
        aliases: ["bangkok", "bbl"],
      },
      {
        name: "Personal:Assets:Cash",
        type: "Assets",
        subType: "Cash",
        aliases: ["cash"],
      },
      {
        name: "Personal:Liabilities:CreditCard:Primary",
        type: "Liabilities",
        subType: "CreditCard",
        aliases: ["credit"],
      },
      {
        name: "Personal:Expenses:Food:Coffee",
        type: "Expenses",
        subType: "Food",
        aliases: ["coffee"],
      },
      {
        name: "Personal:Expenses:Food:Restaurant",
        type: "Expenses",
        subType: "Food",
        aliases: ["restaurant", "food"],
      },
      {
        name: "Personal:Expenses:Transport:Taxi",
        type: "Expenses",
        subType: "Transport",
        aliases: ["taxi", "grab"],
      },
      {
        name: "Personal:Expenses:Transport:BTS",
        type: "Expenses",
        subType: "Transport",
        aliases: ["bts", "skytrain"],
      },
      {
        name: "Personal:Expenses:Utilities:Electricity",
        type: "Expenses",
        subType: "Utilities",
        aliases: ["electricity", "electric"],
      },
      {
        name: "Personal:Expenses:Utilities:Internet",
        type: "Expenses",
        subType: "Utilities",
        aliases: ["internet", "wifi"],
      },
    ],
    rules: {
      defaults: {
        entity: "Personal",
        currency: "THB",
        fallbackCredit: "Personal:Assets:Bank:KBank:Checking",
      },
      items: [
        {
          pattern: "(?i)coffee|latte|cappuccino|กาแฟ",
          debit: "Personal:Expenses:Food:Coffee",
          priority: 10,
        },
        {
          pattern: "(?i)restaurant|food|อาหาร|ร้านอาหาร",
          debit: "Personal:Expenses:Food:Restaurant",
          priority: 10,
        },
        {
          pattern: "(?i)taxi|grab|bolt|รถแท็กซี่",
          debit: "Personal:Expenses:Transport:Taxi",
          priority: 10,
        },
        {
          pattern: "(?i)bts|skytrain|รถไฟฟ้า",
          debit: "Personal:Expenses:Transport:BTS",
          priority: 10,
        },
        {
          pattern: "(?i)electricity|electric|ไฟ",
          debit: "Personal:Expenses:Utilities:Electricity",
          priority: 10,
        },
        {
          pattern: "(?i)internet|wifi|อินเทอร์เน็ต",
          debit: "Personal:Expenses:Utilities:Internet",
          priority: 10,
        },
      ],
      merchants: [
        {
          pattern: "(?i)starbucks|สตาร์บัคส์",
          defaultDebit: "Personal:Expenses:Food:Coffee",
        },
        {
          pattern: "(?i)7-eleven|เซเว่น",
          defaultDebit: "Personal:Expenses:Food:Restaurant",
        },
        {
          pattern: "(?i)grab|bolt",
          defaultDebit: "Personal:Expenses:Transport:Taxi",
        },
        {
          pattern: "(?i)bts|skytrain",
          defaultDebit: "Personal:Expenses:Transport:BTS",
        },
      ],
      payments: [
        {
          pattern: "(?i)kbank|kasikorn|กสิกร",
          credit: "Personal:Assets:Bank:KBank:Checking",
        },
        {
          pattern: "(?i)scb|siam|ไทยพาณิชย์",
          credit: "Personal:Assets:Bank:SCB:Checking",
        },
        {
          pattern: "(?i)bangkok|bbl|กรุงเทพ",
          credit: "Personal:Assets:Bank:Bangkok:Checking",
        },
        { pattern: "(?i)cash|เงินสด", credit: "Personal:Assets:Cash" },
        {
          pattern: "(?i)credit|บัตรเครดิต",
          credit: "Personal:Liabilities:CreditCard:Primary",
        },
      ],
    },
    sampleTransaction: "coffee 100 Starbucks",
  },
  {
    id: "us-usd",
    name: "United States (USD)",
    description:
      "Personal finance template for United States with common US banks and merchants",
    currency: "USD",
    locale: "en-US",
    accounts: [
      {
        name: "Personal:Assets:Bank:Chase:Checking",
        type: "Assets",
        subType: "Bank",
        aliases: ["chase"],
      },
      {
        name: "Personal:Assets:Bank:WellsFargo:Checking",
        type: "Assets",
        subType: "Bank",
        aliases: ["wells", "wellsfargo"],
      },
      {
        name: "Personal:Assets:Bank:BankOfAmerica:Checking",
        type: "Assets",
        subType: "Bank",
        aliases: ["bofa", "bankofamerica"],
      },
      {
        name: "Personal:Assets:Cash",
        type: "Assets",
        subType: "Cash",
        aliases: ["cash"],
      },
      {
        name: "Personal:Liabilities:CreditCard:Primary",
        type: "Liabilities",
        subType: "CreditCard",
        aliases: ["credit"],
      },
      {
        name: "Personal:Expenses:Food:Coffee",
        type: "Expenses",
        subType: "Food",
        aliases: ["coffee"],
      },
      {
        name: "Personal:Expenses:Food:Restaurant",
        type: "Expenses",
        subType: "Food",
        aliases: ["restaurant", "food"],
      },
      {
        name: "Personal:Expenses:Transport:Uber",
        type: "Expenses",
        subType: "Transport",
        aliases: ["uber", "lyft"],
      },
      {
        name: "Personal:Expenses:Transport:Gas",
        type: "Expenses",
        subType: "Transport",
        aliases: ["gas", "fuel"],
      },
      {
        name: "Personal:Expenses:Utilities:Electricity",
        type: "Expenses",
        subType: "Utilities",
        aliases: ["electricity", "electric"],
      },
      {
        name: "Personal:Expenses:Utilities:Internet",
        type: "Expenses",
        subType: "Utilities",
        aliases: ["internet", "wifi"],
      },
    ],
    rules: {
      defaults: {
        entity: "Personal",
        currency: "USD",
        fallbackCredit: "Personal:Assets:Bank:Chase:Checking",
      },
      items: [
        {
          pattern: "(?i)coffee|latte|cappuccino",
          debit: "Personal:Expenses:Food:Coffee",
          priority: 10,
        },
        {
          pattern: "(?i)restaurant|food|dining",
          debit: "Personal:Expenses:Food:Restaurant",
          priority: 10,
        },
        {
          pattern: "(?i)uber|lyft|taxi",
          debit: "Personal:Expenses:Transport:Uber",
          priority: 10,
        },
        {
          pattern: "(?i)gas|fuel|gasoline",
          debit: "Personal:Expenses:Transport:Gas",
          priority: 10,
        },
        {
          pattern: "(?i)electricity|electric|power",
          debit: "Personal:Expenses:Utilities:Electricity",
          priority: 10,
        },
        {
          pattern: "(?i)internet|wifi|broadband",
          debit: "Personal:Expenses:Utilities:Internet",
          priority: 10,
        },
      ],
      merchants: [
        {
          pattern: "(?i)starbucks",
          defaultDebit: "Personal:Expenses:Food:Coffee",
        },
        {
          pattern: "(?i)mcdonalds|burger king|kfc",
          defaultDebit: "Personal:Expenses:Food:Restaurant",
        },
        {
          pattern: "(?i)uber|lyft",
          defaultDebit: "Personal:Expenses:Transport:Uber",
        },
        {
          pattern: "(?i)shell|exxon|chevron|bp",
          defaultDebit: "Personal:Expenses:Transport:Gas",
        },
      ],
      payments: [
        { pattern: "(?i)chase", credit: "Personal:Assets:Bank:Chase:Checking" },
        {
          pattern: "(?i)wells|wellsfargo",
          credit: "Personal:Assets:Bank:WellsFargo:Checking",
        },
        {
          pattern: "(?i)bofa|bankofamerica",
          credit: "Personal:Assets:Bank:BankOfAmerica:Checking",
        },
        { pattern: "(?i)cash", credit: "Personal:Assets:Cash" },
        {
          pattern: "(?i)credit",
          credit: "Personal:Liabilities:CreditCard:Primary",
        },
      ],
    },
    sampleTransaction: "coffee 5.50 Starbucks",
  },
  {
    id: "basic",
    name: "Basic Template",
    description: "Minimal template for testing and getting started",
    currency: "USD",
    locale: "en-US",
    accounts: [
      {
        name: "Personal:Assets:Bank:Checking",
        type: "Assets",
        subType: "Bank",
        aliases: ["checking", "bank"],
      },
      {
        name: "Personal:Assets:Cash",
        type: "Assets",
        subType: "Cash",
        aliases: ["cash"],
      },
      {
        name: "Personal:Liabilities:CreditCard",
        type: "Liabilities",
        subType: "CreditCard",
        aliases: ["credit"],
      },
      {
        name: "Personal:Expenses:Food",
        type: "Expenses",
        subType: "Food",
        aliases: ["food"],
      },
      {
        name: "Personal:Expenses:Transport",
        type: "Expenses",
        subType: "Transport",
        aliases: ["transport"],
      },
    ],
    rules: {
      defaults: {
        entity: "Personal",
        currency: "USD",
        fallbackCredit: "Personal:Assets:Bank:Checking",
      },
      items: [
        {
          pattern: "(?i)food|meal|eat",
          debit: "Personal:Expenses:Food",
          priority: 10,
        },
        {
          pattern: "(?i)transport|travel|ride",
          debit: "Personal:Expenses:Transport",
          priority: 10,
        },
      ],
      merchants: [],
      payments: [
        {
          pattern: "(?i)bank|checking",
          credit: "Personal:Assets:Bank:Checking",
        },
        { pattern: "(?i)cash", credit: "Personal:Assets:Cash" },
        { pattern: "(?i)credit", credit: "Personal:Liabilities:CreditCard" },
      ],
    },
    sampleTransaction: "food 25.00 Restaurant",
  },
];

export function getTemplateById(id: string): LedgerTemplate | undefined {
  return LEDGER_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesByCurrency(currency: string): LedgerTemplate[] {
  return LEDGER_TEMPLATES.filter((template) => template.currency === currency);
}
