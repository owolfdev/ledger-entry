# File Management Commands

Commands for navigating and managing your ledger files in the repository.

## Available Commands

### `files`

List all files in your ledger repository.

#### Syntax

```bash
files [pattern]
```

#### Examples

```bash
# List all files
files

# List files matching a pattern
files *.journal

# List files in a specific directory
files accounts/*

# List journal files
files journals/*
```

#### Output Format

Shows file paths relative to repository root:

```
accounts/
  checking.ledger
  savings.ledger
  credit-card.ledger
journals/
  2024-01.journal
  2024-02.journal
  2024-03.journal
rules/
  validation.rules
  auto-assign.rules
README.md
```

### `journals`

List all journal files in the `/journals` folder.

#### Syntax

```bash
journals
```

#### Examples

```bash
# List all journal files
journals
```

#### Output Format

Shows journal files with creation/modification dates:

```
2024-01.journal    (Jan 1, 2024)
2024-02.journal    (Feb 1, 2024)
2024-03.journal    (Mar 1, 2024)
2024-04.journal    (Apr 1, 2024)
```

### `rules`

List all rule files in the `/rules` folder.

#### Syntax

```bash
rules
```

#### Examples

```bash
# List all rule files
rules
```

#### Output Format

Shows rule files with descriptions:

```
validation.rules    - Transaction validation rules
auto-assign.rules   - Automatic account assignment rules
business.rules      - Business-specific rules
```

### `accounts`

List all account definition files.

#### Syntax

```bash
accounts
```

#### Examples

```bash
# List account files
accounts
```

#### Output Format

Shows account definition files:

```
checking.ledger     - Checking account definition
savings.ledger      - Savings account definition
credit-card.ledger  - Credit card account definition
```

### `load <filepath>`

Load a specific file from the repository into the editor.

#### Syntax

```bash
load <filepath>
```

#### Examples

```bash
# Load a specific journal file
load journals/2024-01.journal

# Load an account file
load accounts/checking.ledger

# Load a rule file
load rules/validation.rules

# Load with relative path
load 2024-01.journal
```

#### Features

- Opens the file in the editor panel
- Shows file contents for editing
- Validates file syntax
- Enables saving changes

### `load -j <journal>`

Load journal files with convenient shortcuts.

#### Syntax

```bash
load -j <journal-shortcut>
```

#### Available Shortcuts

##### `current`

Load the current month's journal file.

```bash
load -j current
```

##### `latest`

Load the most recent journal file.

```bash
load -j latest
```

##### `<month>` (1-12)

Load a specific month by number.

```bash
load -j 1    # January
load -j 3    # March
load -j 12   # December
```

##### `<month-name>`

Load a specific month by name.

```bash
load -j january
load -j february
load -j march
load -j april
load -j may
load -j june
load -j july
load -j august
load -j september
load -j october
load -j november
load -j december

# Abbreviated month names also work
load -j jan
load -j feb
load -j mar
load -j apr
load -j may
load -j jun
load -j jul
load -j aug
load -j sep
load -j oct
load -j nov
load -j dec
```

##### `<year-month>`

Load a specific year-month combination.

```bash
load -j 2024-01    # January 2024
load -j 2024-12    # December 2024
load -j 2023-06    # June 2023
```

### `save`

Save the currently loaded file.

#### Syntax

```bash
save
```

#### Features

- Saves changes to the currently loaded file
- Validates file content before saving
- Shows confirmation message
- Updates repository with changes

## File Organization

### Repository Structure

```
your-ledger-repo/
├── accounts/          # Account definitions
│   ├── checking.ledger
│   ├── savings.ledger
│   └── credit-card.ledger
├── journals/          # Monthly transaction files
│   ├── 2024-01.journal
│   ├── 2024-02.journal
│   └── 2024-03.journal
├── rules/            # Business rules
│   ├── validation.rules
│   └── auto-assign.rules
├── .ledger-entry/    # Configuration
└── README.md         # Documentation
```

### File Types

#### Journal Files (`.journal`)

- Contain transactions for a specific month
- Named with YYYY-MM format
- Store all financial transactions

#### Account Files (`.ledger`)

- Define account hierarchies
- Set opening balances
- Configure account properties

#### Rule Files (`.rules`)

- Define validation rules
- Set up automatic account assignments
- Configure business logic

## Best Practices

### File Naming

- Use descriptive, consistent naming conventions
- Include dates in journal file names
- Use lowercase with hyphens for account files

### File Organization

- Keep related files in appropriate folders
- Use monthly journal files for transactions
- Separate account definitions from transactions

### Regular Maintenance

- Review file structure regularly
- Archive old journal files when appropriate
- Keep account files up to date

## Tips and Shortcuts

### Efficient Navigation

- Use journal shortcuts (`load -j current`) for quick access
- Use tab completion for file paths
- Use `files` command to explore repository structure

### Quick Access

- `load -j current` - Work on current month
- `load -j latest` - Work on most recent month
- `load -j jan` - Quick access to January

### File Management

- Save frequently with `save` command
- Use `files` to verify file structure
- Use `journals` to see available months

## Troubleshooting

### File Not Found

If you get a "file not found" error:

- Check the file path spelling
- Use `files` to see available files
- Verify the file exists in the repository

### Load Errors

If file loading fails:

- Check file permissions
- Verify file format is correct
- Ensure repository is accessible

### Save Errors

If saving fails:

- Check file permissions
- Verify file syntax is valid
- Ensure repository connection is active

## Related Commands

- [Account & Balance Commands](account-balance.md) - View account information
- [Transaction Commands](transactions.md) - Add transactions to loaded files
- [Utility Commands](utilities.md) - Validate and maintain files

## Next Steps

After mastering file management:

1. [Learn transaction commands](transactions.md)
2. [Use account and balance commands](account-balance.md)
3. [Explore utility commands](utilities.md)
4. [Start working with your ledger](../getting-started/create-repository.md)
