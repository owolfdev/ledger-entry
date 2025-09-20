# Creating Your First Repository

Learn how to create and set up your first ledger repository in Ledger Entry.

## Prerequisites

Before creating a repository, ensure you have:

1. **Ledger Entry Account**: A verified account (see [authentication](../authentication/overview.md))
2. **GitHub Integration**: GitHub account connected (see [GitHub setup](../configuration/github-setup.md))
3. **Internet Connection**: Stable connectivity for repository creation

## Step 1: Access Repository Creation

### From the Dashboard

1. **Sign in** to your Ledger Entry account
2. **Navigate** to your dashboard
3. **Click** "Create New Repository" or "New Repository"

### From the Repository List

1. **Go** to the repository list page
2. **Click** the "Create Repository" button
3. **Fill out** the repository creation form

## Step 2: Repository Configuration

### Repository Details

#### Repository Name

Choose a descriptive name for your ledger:

- **Examples**: `personal-ledger-2024`, `business-accounts`, `freelance-finances`
- **Requirements**:
  - Use lowercase letters and hyphens
  - Keep it descriptive and meaningful
  - Avoid special characters

#### Description (Optional)

Add a brief description:

- **Examples**: "Personal financial ledger for 2024", "Business accounting records"
- **Purpose**: Helps identify the repository's purpose

#### Visibility

Choose repository visibility:

- **Private** (Recommended): Only you can access the repository
- **Public**: Anyone can see the repository (not recommended for financial data)

### Repository Template

#### Default Template

The default template creates this structure:

```
your-repository/
├── accounts/          # Account definitions
├── journals/          # Monthly transaction files
├── rules/            # Business rules
├── .ledger-entry/    # Configuration files
└── README.md         # Repository documentation
```

#### Custom Template

You can also:

- Start with a blank repository
- Use a pre-built template
- Import from an existing ledger file

## Step 3: Initial Setup

### Account Structure

The system will create basic account categories:

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
  Transportation
  Utilities
  Office
```

### Initial Files Created

#### Account Files (`/accounts/`)

- `checking.ledger` - Checking account definition
- `savings.ledger` - Savings account definition
- `credit-card.ledger` - Credit card account definition

#### Journal Files (`/journals/`)

- `2024-01.journal` - Current month's transaction file
- Additional monthly files created as needed

#### Rule Files (`/rules/`)

- `validation.rules` - Basic validation rules
- `auto-assign.rules` - Automatic account assignment rules

#### Configuration Files

- `.ledger-entry/config` - Repository configuration
- `README.md` - Repository documentation

## Step 4: Repository Verification

### Verify Repository Creation

1. **Check** that the repository appears in your repository list
2. **Verify** the file structure is correct
3. **Test** loading a file with the `load` command
4. **Confirm** you can save changes

### Test Basic Operations

```bash
# List files in repository
files

# List accounts
accounts

# Show balances (should be empty initially)
balance

# Load current month's journal
load -j current
```

## Step 5: Customize Your Repository

### Account Customization

1. **Edit Account Files**: Modify account definitions in `/accounts/`
2. **Add New Accounts**: Create additional account files as needed
3. **Organize Hierarchy**: Structure accounts logically for your needs

### Transaction Setup

1. **Load Current Journal**: Use `load -j current`
2. **Add Opening Balances**: Set initial account balances
3. **Add Sample Transactions**: Practice with test data

### Rule Configuration

1. **Review Validation Rules**: Check `/rules/validation.rules`
2. **Set Up Auto-Assignment**: Configure automatic account assignments
3. **Customize Business Rules**: Add rules specific to your situation

## Repository Management

### Repository List

Access your repositories from:

- **Dashboard**: Quick access to recent repositories
- **Repository List**: Complete list of all repositories
- **Search**: Find repositories by name or description

### Repository Actions

For each repository, you can:

- **Open**: Access the repository interface
- **Rename**: Change repository name
- **Archive**: Move to archived repositories
- **Delete**: Remove repository (with confirmation)

### Repository Settings

Configure repository-specific settings:

- **Access Control**: Manage who can access the repository
- **Backup Settings**: Configure automatic backups
- **Integration Settings**: Set up external integrations

## Best Practices

### Repository Organization

1. **Use Descriptive Names**: Choose names that clearly indicate purpose
2. **Separate Concerns**: Use different repositories for different purposes
3. **Regular Backups**: Ensure repositories are backed up regularly
4. **Version Control**: Take advantage of Git's version control features

### Data Management

1. **Start Simple**: Begin with basic account structure
2. **Grow Gradually**: Add complexity as you become comfortable
3. **Regular Validation**: Use `validate` command regularly
4. **Document Changes**: Keep notes about significant changes

### Security

1. **Private Repositories**: Always use private repositories for financial data
2. **Access Control**: Be careful about who has access
3. **Regular Updates**: Keep repository settings up to date
4. **Monitor Activity**: Check repository activity regularly

## Troubleshooting

### Repository Creation Failed

If repository creation fails:

1. **Check GitHub Connection**: Verify GitHub integration is working
2. **Check Permissions**: Ensure your GitHub token has repository creation permissions
3. **Try Again**: Repository creation can sometimes fail due to network issues
4. **Contact Support**: If problems persist, contact support

### Repository Not Appearing

If your repository doesn't appear in the list:

1. **Refresh Page**: Try refreshing the repository list
2. **Check GitHub**: Verify the repository was created on GitHub
3. **Check Permissions**: Ensure you have access to the repository
4. **Wait**: Sometimes there's a delay in repository synchronization

### File Access Issues

If you can't access repository files:

1. **Check Repository Access**: Ensure you have proper permissions
2. **Verify File Structure**: Check that files exist in the repository
3. **Test GitHub Access**: Verify you can access the repository on GitHub
4. **Check Token**: Ensure your GitHub token is valid and has proper permissions

## Next Steps

After creating your first repository:

1. [Learn the command system](../commands/overview.md)
2. [Set up your account structure](../commands/account-balance.md)
3. [Start adding transactions](../commands/transactions.md)
4. [Validate your data](../commands/utilities.md)
5. [Explore advanced features](advanced-features.md)

## Additional Resources

- [Ledger CLI Basics](ledger-cli-basics.md)
- [GitHub Setup Guide](../configuration/github-setup.md)
- [Command Reference](../commands/overview.md)
- [Authentication Guide](../authentication/overview.md)
