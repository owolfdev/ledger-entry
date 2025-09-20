# Introduction to Ledger CLI

The Ledger CLI (Command Line Interface) is the heart of Ledger Entry, providing powerful commands for managing your financial data efficiently.

## What is Ledger CLI?

Ledger CLI is a text-based accounting system that uses plain text files to store your financial data. It's based on the popular [Ledger](https://www.ledger-cli.org/) accounting tool, but enhanced with a web interface and modern features.

## Core Concepts

### Transactions

Every financial event is recorded as a transaction with the following structure:

```
2024-01-15 * Coffee Shop Purchase
    Expenses:Food:Coffee          $5.00
    Assets:Checking Account      -$5.00
```

### Accounts

Accounts are organized in a hierarchical structure using colons:

```
Assets
  Checking Account
  Savings Account
  Cash
Liabilities
  Credit Card
  Loans
Equity
  Owner's Equity
Income
  Salary
  Freelance
Expenses
  Food
    Groceries
    Coffee
  Transportation
    Gas
    Public Transit
```

### Balances

The system automatically calculates account balances by summing all transactions affecting each account.

## File Organization

Your ledger data is organized in several types of files:

### Journal Files (`/journals/`)

- Monthly transaction files (e.g., `2024-01.journal`)
- Contains all transactions for a specific month
- Organized chronologically

### Account Files (`/accounts/`)

- Define account hierarchies and metadata
- Set opening balances
- Configure account properties

### Rule Files (`/rules/`)

- Define validation rules
- Set up automatic account assignments
- Configure business logic

## Benefits of Text-Based Accounting

1. **Version Control**: Track changes over time with Git
2. **Portability**: Your data isn't locked into proprietary formats
3. **Automation**: Easy to process with scripts and tools
4. **Transparency**: Human-readable format makes auditing simple
5. **Backup**: Simple file-based backup and restore

## Getting Started with Commands

The Ledger CLI provides several categories of commands:

- **Account & Balance Commands**: View balances and account information
- **File Management Commands**: Navigate and manage your ledger files
- **Transaction Commands**: Add and manage transactions
- **Utility Commands**: Validation and system maintenance

## Next Steps

- Learn about [authentication](../authentication/overview.md)
- Set up [GitHub integration](../configuration/github-setup.md)
- Explore [available commands](../commands/overview.md)
- Start with [basic file operations](../commands/file-management.md)
