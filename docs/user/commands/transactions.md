# Transaction Commands

Commands for adding and managing transactions in your ledger.

## Available Commands

### `add` (natural language)

Create a transaction by describing it in plain English. The app parses your input, applies your rules, and prepares a balanced Ledger entry for you to review and save.

#### Syntax

```bash
add <item> <amount> [currency] [, <item> <amount>] [@|at <merchant>] [with <payment>] [for <entity>] [on <date>] [memo <comment>]
```

#### Components

- `item` and `amount`: One or more purchase items, optionally comma-separated
- `@|at <merchant>`: Merchant name (e.g., `@ Starbucks` or `at Starbucks`)
- `with <payment>`: Payment method (e.g., `with visa`)
- `for <entity>`: Entity or context (e.g., `for Personal`, `for Business`)
- `on <date>`: Specific date (`YYYY-MM-DD`) or relative (`today`, `yesterday`)
- `memo <comment>`: Free-form note (quote if it contains spaces)

#### Examples

```bash
add coffee 10 @ Starbucks
add lunch 25 with visa for Personal on today
add coffee 10, croissant 5 @ Starbucks memo "morning coffee"
add groceries 45.20 USD @ Trader Joe's with amex for Household on 2025-09-20
```

#### How mapping works

The parser extracts items, merchant, payment, entity, date, currency, and memo. Then your rules map these to accounts:

- Item rules → expense accounts (debits)
- Merchant rules → default categories or accounts
- Payment rules → funding/asset or liability account (credit side)
- Default currency/entity come from rules or repository defaults

The result is a standard Ledger transaction inserted into the input for you to confirm or edit.

> Tip: If an item or merchant isn’t mapped as you expect, update your rules in `rules/*.json` and try again.

---

### `add transaction`

Add a new transaction template to the current journal file.

#### Syntax

```bash
add transaction
```

#### Features

- Creates a new transaction template in the editor
- Uses current date as the transaction date
- Provides a standard transaction structure
- Ready for immediate editing and customization

#### Example Output

When you run `add transaction`, it creates a template like this:

```
2024-01-15 *
    Assets:Checking Account          $0.00
    Expenses:                         $0.00
```

## Transaction Structure

### Basic Transaction Format

```
YYYY-MM-DD [*] Description
    Account1                         $Amount1
    Account2                         $Amount2
```

### Transaction Components

#### Date

- Format: `YYYY-MM-DD` (e.g., `2024-01-15`)
- Must be the first element on the line
- Can be any date (past, present, or future)

#### Status

- `*` - Cleared transaction (reconciled)
- `!` - Pending transaction (not yet cleared)
- No symbol - Uncleared transaction

#### Description

- Brief description of the transaction
- Should be descriptive and clear
- Examples: "Coffee Shop Purchase", "Salary Deposit", "Electric Bill"

#### Accounts and Amounts

- Each account on its own line
- Indented with spaces (typically 4 spaces)
- Amounts aligned in columns
- Positive amounts for debits (increases assets/expenses)
- Negative amounts for credits (increases liabilities/equity/income)

## Transaction Examples

### Simple Purchase

```
2024-01-15 * Coffee Shop Purchase
    Expenses:Food:Coffee              $5.00
    Assets:Checking Account          -$5.00
```

### Salary Deposit

```
2024-01-01 * Salary Deposit
    Assets:Checking Account        $3,000.00
    Income:Salary                 -$3,000.00
```

### Credit Card Payment

```
2024-01-15 * Credit Card Payment
    Liabilities:Credit Card        $500.00
    Assets:Checking Account       -$500.00
```

### Transfer Between Accounts

```
2024-01-15 * Transfer to Savings
    Assets:Savings Account         $1,000.00
    Assets:Checking Account       -$1,000.00
```

### Multi-Account Transaction

```
2024-01-15 * Grocery Shopping
    Expenses:Food:Groceries         $150.00
    Expenses:Food:Snacks             $25.00
    Assets:Credit Card            -$175.00
```

## Account Types in Transactions

### Assets

- **Debit** (positive): Increases asset value
- **Credit** (negative): Decreases asset value
- Examples: `Assets:Checking`, `Assets:Savings`, `Assets:Cash`

### Liabilities

- **Debit** (positive): Decreases liability (paying off debt)
- **Credit** (negative): Increases liability (borrowing money)
- Examples: `Liabilities:Credit Card`, `Liabilities:Loans`

### Equity

- **Debit** (positive): Decreases equity
- **Credit** (negative): Increases equity
- Examples: `Equity:Owner`, `Equity:Retained Earnings`

### Income

- **Debit** (positive): Decreases income (refunds, adjustments)
- **Credit** (negative): Increases income (earning money)
- Examples: `Income:Salary`, `Income:Sales`

### Expenses

- **Debit** (positive): Increases expenses (spending money)
- **Credit** (negative): Decreases expenses (refunds, adjustments)
- Examples: `Expenses:Food`, `Expenses:Rent`

## Transaction Rules

### Double-Entry Principle

Every transaction must affect at least two accounts, and the total debits must equal total credits.

### Balance Verification

```
Total Debits = Total Credits
```

### Example Balance Check

```
Transaction: Coffee Purchase ($5.00)
Debits:  $5.00 (Expenses:Food:Coffee)
Credits: $5.00 (Assets:Checking Account)
Balance: $5.00 = $5.00 ✓
```

## Best Practices

### Transaction Entry

1. **Use Clear Descriptions**: Make transactions easy to understand
2. **Be Consistent**: Use consistent account names and formatting
3. **Include Details**: Add relevant details in descriptions
4. **Date Appropriately**: Use accurate transaction dates

### Account Organization

1. **Hierarchical Structure**: Use colons to create account hierarchies
2. **Logical Grouping**: Group related accounts together
3. **Consistent Naming**: Use consistent naming conventions
4. **Regular Review**: Periodically review and clean up account structure

### Amount Formatting

1. **Currency Symbol**: Include currency symbols ($, €, £, etc.)
2. **Decimal Places**: Use two decimal places for currency
3. **Alignment**: Align amounts in columns for readability
4. **Signs**: Use appropriate signs (+/-) for debits and credits

## Tips and Shortcuts

### Quick Transaction Entry

- Use `add transaction` to create templates quickly
- Copy and paste similar transactions
- Use tab completion for account names
- Save frequently to avoid data loss

### Common Transaction Patterns

- **Income**: Income account (credit) → Asset account (debit)
- **Expense**: Expense account (debit) → Asset account (credit)
- **Transfer**: Asset account (debit) → Asset account (credit)
- **Loan Payment**: Liability account (debit) → Asset account (credit)

### Validation

- Always verify that debits equal credits
- Use the `validate` command to check for errors
- Review transactions before saving
- Keep backups of important data

## Troubleshooting

### Unbalanced Transactions

If transactions don't balance:

- Check that debits equal credits
- Verify account names are spelled correctly
- Ensure amounts are formatted properly
- Use the `validate` command for assistance

### Account Not Found

If you get "account not found" errors:

- Check account name spelling
- Verify accounts are defined in account files
- Use the `accounts` command to see available accounts
- Create missing accounts if necessary

### Date Issues

If you have date-related problems:

- Use proper YYYY-MM-DD format
- Ensure dates are logical and consistent
- Check for future dates if not intended
- Verify date alignment with journal files

## Related Commands

- [File Management Commands](file-management.md) - Load and save transaction files
- [Account & Balance Commands](account-balance.md) - View account balances
- [Utility Commands](utilities.md) - Validate transactions

## Next Steps

After mastering transaction commands:

1. [Learn account and balance commands](account-balance.md)
2. [Use file management commands](file-management.md)
3. [Explore utility commands](utilities.md)
4. [Start building your ledger](../getting-started/create-repository.md)
