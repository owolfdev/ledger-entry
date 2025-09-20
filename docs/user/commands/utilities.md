# Utility Commands

Commands for validation, maintenance, and system management of your ledger.

## Available Commands

### `validate`

Validate ledger entries for accuracy and consistency.

#### Syntax

```bash
validate [options]
```

#### Features

- Checks transaction balance (debits = credits)
- Validates account references
- Verifies date formats
- Checks for syntax errors
- Reports data inconsistencies

#### Examples

```bash
# Validate all ledger entries
validate

# Validate specific file
validate journals/2024-01.journal

# Validate with verbose output
validate -v
```

#### Validation Checks

##### Transaction Balance

Ensures every transaction balances:

```
✓ Transaction balances: All transactions are balanced
✗ Transaction balances: Transaction on 2024-01-15 is unbalanced
  Debits: $100.00, Credits: $95.00
```

##### Account References

Verifies all referenced accounts exist:

```
✓ Account references: All accounts are defined
✗ Account references: Unknown account 'Assets:NonExistent'
```

##### Date Validation

Checks date formats and logic:

```
✓ Date validation: All dates are properly formatted
✗ Date validation: Invalid date format in transaction on line 15
```

##### Syntax Validation

Verifies ledger syntax is correct:

```
✓ Syntax validation: No syntax errors found
✗ Syntax validation: Syntax error on line 23
```

#### Output Format

```
Ledger Validation Report
========================

✓ Transaction balances: All transactions are balanced
✓ Account references: All accounts are defined
✓ Date validation: All dates are properly formatted
✓ Syntax validation: No syntax errors found

Total transactions: 156
Total accounts: 23
Validation completed successfully.
```

### `clear`

Clear the terminal output for a clean workspace.

#### Syntax

```bash
clear
```

#### Features

- Clears all terminal output
- Provides a clean workspace
- Maintains command history
- Does not affect loaded files or data

#### Examples

```bash
# Clear terminal output
clear
```

#### Use Cases

- Clean up cluttered terminal output
- Start fresh after validation reports
- Prepare for new command sequences
- Focus on current task without distractions

### `help`

Show available commands and usage information.

#### Syntax

```bash
help [command]
```

#### Examples

```bash
# Show all available commands
help

# Show help for specific command
help balance
help load
help add transaction
```

#### Output Format

```
📖 Available commands:

📊 Account & Balance Commands:
  balance, bal     - Show account balances
  accounts         - List all accounts

📁 File Management Commands:
  files            - List all files in repository
  journals         - List journal files in /journals folder
  rules            - List rule files in /rules folder
  accounts         - List account files
  load <filepath>  - Load a file from repository
  load -j <journal> - Load journal with shortcuts:
                    • current - current month
                    • latest - most recent journal
                    • <month> - specific month (1-12)
                    • <month-name> - specific month (january, sep, etc.)
                    • <year-month> - specific YYYY-MM
  save             - Save current file

✏️ Transaction Commands:
  add transaction  - Add transaction template

🔧 Utility Commands:
  validate         - Validate ledger entries
  clear            - Clear terminal output
  help             - Show this help message
```

## Validation Best Practices

### Regular Validation

- Run `validate` after adding new transactions
- Validate before saving important changes
- Use validation as part of monthly reconciliation
- Validate after importing data from other systems

### Error Resolution

When validation finds errors:

1. **Read Error Messages Carefully**: Understand what's wrong
2. **Check Transaction Balance**: Ensure debits equal credits
3. **Verify Account Names**: Check spelling and hierarchy
4. **Review Date Formats**: Use proper YYYY-MM-DD format
5. **Fix Syntax Errors**: Correct any formatting issues

### Validation Workflow

```
1. Add/edit transactions
2. Run validate command
3. Review any errors
4. Fix identified issues
5. Re-validate until clean
6. Save changes
```

## System Maintenance

### Regular Maintenance Tasks

- **Daily**: Validate recent transactions
- **Weekly**: Review account balances
- **Monthly**: Validate entire ledger
- **Quarterly**: Archive old journal files
- **Annually**: Review account structure

### Data Integrity

- Keep backups of important data
- Validate before major changes
- Document any manual corrections
- Maintain audit trail of changes

### Performance Optimization

- Use appropriate file organization
- Keep journal files reasonably sized
- Archive old data when appropriate
- Monitor repository size and growth

## Troubleshooting

### Validation Errors

#### Unbalanced Transactions

```
Error: Transaction on 2024-01-15 is unbalanced
  Debits: $100.00, Credits: $95.00
  Difference: $5.00
```

**Solution**: Check transaction amounts and ensure debits equal credits.

#### Missing Accounts

```
Error: Unknown account 'Assets:NonExistent'
  Referenced in transaction on line 23
```

**Solution**: Either create the missing account or correct the account name.

#### Date Format Errors

```
Error: Invalid date format 'Jan 15, 2024'
  Expected format: YYYY-MM-DD
```

**Solution**: Use proper date format (2024-01-15).

#### Syntax Errors

```
Error: Syntax error on line 15
  Unexpected character: @
```

**Solution**: Check for invalid characters and fix formatting.

### System Issues

#### Command Not Found

If commands don't work:

- Check command spelling
- Use `help` to see available commands
- Ensure you're in the correct context
- Restart the application if needed

#### Performance Issues

If the system is slow:

- Validate large files in sections
- Archive old journal files
- Check repository size
- Clear terminal output regularly

## Tips and Shortcuts

### Efficient Validation

- Use `validate` regularly during data entry
- Fix errors immediately when found
- Use clear command descriptions
- Keep validation reports for reference

### Command Shortcuts

- Use `clear` to clean up terminal output
- Use `help` to explore new features
- Use tab completion for commands
- Use command history for repetitive tasks

### Error Prevention

- Double-check transaction amounts
- Use consistent account naming
- Validate before saving
- Keep backups of important data

## Related Commands

- [Account & Balance Commands](account-balance.md) - Check balances after validation
- [File Management Commands](file-management.md) - Load files for validation
- [Transaction Commands](transactions.md) - Add transactions that need validation

## Next Steps

After mastering utility commands:

1. [Learn account and balance commands](account-balance.md)
2. [Master file management](file-management.md)
3. [Start adding transactions](transactions.md)
4. [Build a complete ledger system](../getting-started/create-repository.md)
