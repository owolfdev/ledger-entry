# Account & Balance Commands

Commands for viewing account information and balances in your ledger.

## Available Commands

### `balance` / `bal`

Show account balances for all or specific accounts.

#### Syntax

```bash
balance [account-pattern]
bal [account-pattern]
```

#### Examples

```bash
# Show all account balances
balance

# Show balances for a specific account
balance Assets

# Show balances for accounts matching a pattern
balance Assets:*

# Show balances for checking account
balance Assets:Checking
```

#### Output Format

The balance command shows:

- Account name (hierarchical structure)
- Current balance (debit/credit format)
- Running total (if applicable)

#### Sample Output

```
             $1,250.00  Assets:Checking
               $500.00  Assets:Savings
             $1,750.00  Assets
            -$1,200.00  Liabilities:Credit Card
            -$1,200.00  Liabilities
               $550.00  Equity:Owner
               $550.00  Equity
                    $0
```

### `accounts`

List all accounts in your ledger system.

#### Syntax

```bash
accounts [pattern]
```

#### Examples

```bash
# List all accounts
accounts

# List accounts matching a pattern
accounts Assets:*

# List checking accounts
accounts *Checking*

# List expense accounts
accounts Expenses:*
```

#### Output Format

The accounts command shows:

- Account hierarchy (indented structure)
- Account names
- Account metadata (if configured)

#### Sample Output

```
Assets
  Checking
  Savings
  Cash
Liabilities
  Credit Card
  Loans
Equity
  Owner
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

## Account Hierarchy

Accounts are organized hierarchically using colons (`:`) as separators:

### Standard Account Types

#### Assets

Accounts that represent things you own:

- `Assets:Checking` - Bank checking account
- `Assets:Savings` - Bank savings account
- `Assets:Cash` - Physical cash on hand
- `Assets:Investments` - Investment accounts
- `Assets:Equipment` - Business equipment

#### Liabilities

Accounts that represent debts or obligations:

- `Liabilities:Credit Card` - Credit card balances
- `Liabilities:Loans` - Outstanding loans
- `Liabilities:Accounts Payable` - Money owed to vendors

#### Equity

Ownership interest in the business:

- `Equity:Owner` - Owner's equity
- `Equity:Retained Earnings` - Profits retained in business

#### Income

Sources of revenue:

- `Income:Salary` - Employment income
- `Income:Freelance` - Freelance work income
- `Income:Sales` - Product or service sales

#### Expenses

Costs and expenses:

- `Expenses:Food` - Food and dining expenses
- `Expenses:Transportation` - Travel and transportation costs
- `Expenses:Office` - Office supplies and equipment
- `Expenses:Utilities` - Utility bills

## Balance Display

### Debit and Credit Format

Balances are displayed using standard accounting conventions:

- **Positive amounts** (no sign) represent debit balances
- **Negative amounts** (with `-`) represent credit balances

### Currency Formatting

- Amounts are displayed with currency symbols
- Thousands are separated with commas
- Decimal places show cents

## Tips and Best Practices

### Account Naming

- Use descriptive names that clearly indicate the account's purpose
- Follow a consistent naming convention
- Use hierarchical structure to group related accounts

### Balance Interpretation

- **Asset accounts**: Positive balances are normal (you own assets)
- **Liability accounts**: Negative balances are normal (you owe money)
- **Equity accounts**: Can be positive or negative depending on business health
- **Income accounts**: Negative balances indicate income earned
- **Expense accounts**: Positive balances indicate expenses incurred

### Regular Monitoring

- Check balances regularly to ensure accuracy
- Use balance commands to verify transaction postings
- Monitor account trends over time

## Troubleshooting

### No Accounts Found

If the `accounts` command shows no results:

- Ensure you have account definitions in your `/accounts/` folder
- Check that your ledger files are properly loaded
- Verify your repository structure is correct

### Balance Discrepancies

If balances don't match expectations:

- Use the `validate` command to check for errors
- Review recent transactions for accuracy
- Check for missing or duplicate entries

### Account Not Found

If a specific account doesn't appear:

- Verify the account name spelling and hierarchy
- Check that the account has been defined
- Ensure the account has transactions or an opening balance

## Related Commands

- [File Management Commands](file-management.md) - Load and manage ledger files
- [Transaction Commands](transactions.md) - Add transactions that affect balances
- [Utility Commands](utilities.md) - Validate and maintain your ledger

## Next Steps

After mastering account and balance commands:

1. [Learn file management commands](file-management.md)
2. [Start adding transactions](transactions.md)
3. [Use validation utilities](utilities.md)
4. [Explore advanced features](../getting-started/advanced-features.md)
