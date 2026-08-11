import type { AccountCategory, BookType, LedgerAccount } from "@/lib/ledger/types";

type StarterLedgerTemplate = {
  accounts: LedgerAccount[];
  bookType: BookType;
  name: string;
  slug: string;
};

function account(
  name: string,
  category: AccountCategory,
  description?: string,
): LedgerAccount {
  return { category, description, name };
}

export const STARTER_LEDGER_TEMPLATES: StarterLedgerTemplate[] = [
  {
    bookType: "business",
    name: "Business Ledger",
    slug: "business-ledger",
    accounts: [
      account("Assets:Bank:Checking", "asset", "Primary operating bank account"),
      account("Assets:AccountsReceivable", "asset", "Customer invoices owed"),
      account("Assets:Cash", "asset", "Cash on hand"),
      account("Liabilities:CreditCard", "liability", "Primary company credit card"),
      account("Liabilities:SalesTaxPayable", "liability", "Sales tax collected"),
      account("Equity:OwnerEquity", "equity", "Owner capital and retained earnings"),
      account("Income:Consulting", "income", "Consulting or services revenue"),
      account("Income:ProductSales", "income", "Product or subscription revenue"),
      account("Expenses:Advertising", "expense", "Paid ads and promotion"),
      account("Expenses:BankFees", "expense", "Bank and payment processing fees"),
      account("Expenses:Meals", "expense", "Client or team meals"),
      account("Expenses:OfficeSupplies", "expense", "Office and stationery purchases"),
      account("Expenses:Payroll", "expense", "Payroll and contractor payouts"),
      account("Expenses:Rent", "expense", "Office rent or coworking"),
      account("Expenses:Software", "expense", "Software subscriptions"),
      account("Expenses:Travel", "expense", "Flights, lodging, and transportation"),
      account("Expenses:Utilities", "expense", "Internet, phone, and utilities"),
    ],
  },
  {
    bookType: "personal",
    name: "Personal Ledger",
    slug: "personal-ledger",
    accounts: [
      account("Assets:Bank:Checking", "asset", "Primary checking account"),
      account("Assets:Bank:Savings", "asset", "Savings account"),
      account("Assets:Cash", "asset", "Cash on hand"),
      account("Liabilities:CreditCard", "liability", "Primary personal credit card"),
      account("Liabilities:Loan", "liability", "Loan or installment balance"),
      account("Equity:OpeningBalances", "equity", "Initial opening balances"),
      account("Income:Salary", "income", "Salary and wages"),
      account("Income:Other", "income", "Other incoming funds"),
      account("Expenses:Dining", "expense", "Restaurants and takeout"),
      account("Expenses:Entertainment", "expense", "Entertainment and leisure"),
      account("Expenses:Groceries", "expense", "Groceries and household food"),
      account("Expenses:Health", "expense", "Medical and health-related costs"),
      account("Expenses:Housing", "expense", "Rent, mortgage, and housing"),
      account("Expenses:Insurance", "expense", "Insurance premiums"),
      account("Expenses:Shopping", "expense", "General shopping purchases"),
      account("Expenses:Transportation", "expense", "Fuel, transit, and rides"),
      account("Expenses:Utilities", "expense", "Electricity, internet, and phone"),
    ],
  },
];
