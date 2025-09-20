# Commands Overview

Ledger Entry provides a powerful command-line interface for managing your financial data. This section covers all available commands organized by category.

## Command Categories

The Ledger CLI commands are organized into four main categories:

### 📊 Account & Balance Commands

Commands for viewing account information and balances:

- `balance`, `bal` - Show account balances
- `accounts` - List all accounts

### 📁 File Management Commands

Commands for navigating and managing your ledger files:

- `files` - List all files in repository
- `journals` - List journal files in /journals folder
- `rules` - List rule files in /rules folder
- `accounts` - List account files
- `load <filepath>` - Load a file from repository
- `load -j <journal>` - Load journal with shortcuts
- `save` - Save current file

### ✏️ Transaction Commands

Commands for adding and managing transactions:

- `add transaction` - Add transaction template

### 🔧 Utility Commands

Commands for validation and system maintenance:

- `validate` - Validate ledger entries
- `clear` - Clear terminal output
- `help` - Show this help message

## How to Use Commands

### Command Syntax

Most commands follow this pattern:

```
command [options] [arguments]
```

Examples:

- `load 2024-01.journal` - Load a specific file
- `load -j current` - Load current month's journal
- `balance` - Show all account balances

### Getting Help

- `help` - Show all available commands
- `help <command>` - Show detailed help for a specific command

### Command History

The terminal maintains a history of your commands:

- Use arrow keys to navigate through previous commands
- Press Enter to execute a command again
- Use Tab for command completion

## Command Examples

### Viewing Your Data

```bash
# List all accounts
accounts

# Show account balances
balance

# List all files in repository
files

# List journal files
journals
```

### Loading Files

```bash
# Load a specific file
load accounts/checking.ledger

# Load current month's journal
load -j current

# Load specific month (January)
load -j january

# Load specific month (September)
load -j sep
```

### Adding Transactions

```bash
# Add a new transaction
add transaction
```

### Validation and Maintenance

```bash
# Validate all ledger entries
validate

# Clear terminal output
clear
```

## Navigation

Use these navigation commands to explore the documentation:

- [Account & Balance Commands](account-balance.md)
- [File Management Commands](file-management.md)
- [Transaction Commands](transactions.md)
- [Utility Commands](utilities.md)

## Best Practices

### Command Efficiency

- Use command shortcuts (e.g., `bal` instead of `balance`)
- Take advantage of tab completion
- Use the command history for repetitive tasks

### Data Management

- Regularly validate your ledger entries
- Save your work frequently
- Use descriptive file names and account names

### Learning Commands

- Start with basic commands like `accounts` and `balance`
- Practice with sample data before using real financial data
- Use `help` command to explore new features

## Next Steps

After understanding the command overview:

1. [Learn account and balance commands](account-balance.md)
2. [Master file management](file-management.md)
3. [Start adding transactions](transactions.md)
4. [Use utility commands](utilities.md)
5. [Explore advanced features](../getting-started/advanced-features.md)
