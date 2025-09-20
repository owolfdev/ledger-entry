# Introduction to Ledger Entry

Welcome to Ledger Entry, a modern web-based ledger management application that brings the power of double-entry bookkeeping to your browser.

## What is Ledger Entry?

Ledger Entry is a comprehensive financial ledger application designed for individuals and small businesses who want to maintain accurate financial records using the proven double-entry bookkeeping system. Built with modern web technologies, it provides a clean, intuitive interface for managing your financial data.

## Key Features

- **Double-Entry Bookkeeping**: Ensures your books are always balanced
- **Repository-Based Storage**: Your ledger data is stored in Git repositories for version control and backup
- **Command-Line Interface**: Powerful terminal commands for efficient data entry
- **Real-Time Validation**: Immediate feedback on transaction validity
- **Secure Authentication**: Protect your financial data with secure user accounts
- **GitHub Integration**: Seamlessly sync your ledgers with GitHub repositories

## How It Works

Ledger Entry follows the traditional double-entry bookkeeping principles:

1. **Every transaction affects at least two accounts**
2. **Total debits must equal total credits**
3. **The accounting equation (Assets = Liabilities + Equity) is always maintained**

## Repository Structure

Your ledger data is organized in a structured repository format:

```
your-ledger/
├── accounts/          # Account definitions
├── journals/          # Transaction journals (organized by month)
├── rules/            # Business rules and validation
└── README.md         # Project documentation
```

## Getting Started

1. [Create an account](../authentication/sign-up.md) or [sign in](../authentication/sign-in.md)
2. [Configure GitHub integration](../configuration/github-setup.md)
3. [Create your first ledger repository](../getting-started/create-repository.md)
4. [Learn the basic commands](../commands/overview.md)

## Next Steps

- Learn about [Ledger CLI basics](ledger-cli-basics.md)
- Explore [authentication options](../authentication/overview.md)
- Set up [GitHub configuration](../configuration/overview.md)
- Master the [command system](../commands/overview.md)
