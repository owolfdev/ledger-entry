# GitHub Setup

Learn how to connect your GitHub account to Ledger Entry for secure repository storage and management.

## Why GitHub Integration?

GitHub integration provides several benefits for your ledger data:

- **Secure Storage**: Your financial data is stored in private Git repositories
- **Version Control**: Track all changes to your financial records over time
- **Automatic Backup**: Git's distributed nature provides built-in backup
- **Access Anywhere**: Access your data from any device with internet connectivity
- **Collaboration**: Share repositories with accountants or business partners
- **Data Portability**: Your data isn't locked into a proprietary format

## Prerequisites

Before setting up GitHub integration, ensure you have:

1. **GitHub Account**: A free or paid GitHub account
2. **Ledger Entry Account**: A verified Ledger Entry account
3. **Internet Connection**: Stable internet connectivity

## Step 1: Create a GitHub Personal Access Token

### Generate the Token

1. **Sign in to GitHub**: Go to [github.com](https://github.com) and sign in
2. **Access Settings**: Click your profile picture → Settings
3. **Developer Settings**: Scroll down and click "Developer settings"
4. **Personal Access Tokens**: Click "Personal access tokens" → "Tokens (classic)"
5. **Generate New Token**: Click "Generate new token" → "Generate new token (classic)"

### Configure Token Permissions

For Ledger Entry, your token needs these permissions:

- **repo** (Full control of private repositories)
  - ✅ repo:status
  - ✅ repo_deployment
  - ✅ public_repo
  - ✅ repo:invite
  - ✅ security_events
- **user** (Update user data)
  - ✅ user:email
  - ✅ user:follow

### Token Configuration

1. **Note**: Give your token a descriptive name (e.g., "Ledger Entry Access")
2. **Expiration**: Set an appropriate expiration date (recommend 1 year)
3. **Select Scopes**: Check the permissions listed above
4. **Generate**: Click "Generate token"
5. **Copy Token**: Immediately copy the token (you won't see it again)

## Step 2: Configure GitHub Integration in Ledger Entry

### Access GitHub Configuration

1. **Sign in to Ledger Entry**: Use your account credentials
2. **Go to Settings**: Navigate to your account settings or configuration page
3. **GitHub Integration**: Look for the GitHub integration section

### Enter Your Token

1. **Token Field**: Paste your GitHub personal access token
2. **Verify Connection**: Click "Test Connection" or "Verify"
3. **Save Configuration**: Click "Save" to store your token securely

### Repository Access Setup

1. **Repository Creation**: Ledger Entry will now be able to create repositories
2. **File Management**: You can read and write ledger files
3. **Version Control**: All changes will be tracked in Git

## Step 3: Create Your First Repository

### Repository Creation

1. **New Repository**: Click "Create New Repository" or similar button
2. **Repository Name**: Choose a descriptive name (e.g., "personal-ledger-2024")
3. **Visibility**: Choose "Private" for financial data security
4. **Initialize**: Let Ledger Entry set up the initial structure

### Repository Structure

Ledger Entry will create this structure:

```
your-repository/
├── accounts/          # Account definitions
├── journals/          # Monthly transaction files
├── rules/            # Business rules
├── .ledger-entry/    # Configuration files
└── README.md         # Repository documentation
```

## Security Best Practices

### Token Security

- **Never Share**: Never share your GitHub token with anyone
- **Secure Storage**: Store the token in a password manager
- **Regular Rotation**: Regenerate tokens periodically (every 6-12 months)
- **Minimal Permissions**: Only grant the permissions you actually need

### Repository Security

- **Private Repositories**: Always use private repositories for financial data
- **Access Control**: Be careful about who you grant repository access to
- **Regular Backups**: Ensure your repositories are backed up
- **Monitor Activity**: Regularly check your GitHub activity log

### Account Security

- **Strong Passwords**: Use strong passwords for both GitHub and Ledger Entry
- **Two-Factor Authentication**: Enable 2FA on your GitHub account
- **Regular Updates**: Keep your GitHub account security settings up to date

## Troubleshooting

### Connection Issues

If you're having trouble connecting to GitHub:

1. **Check Token**: Verify your token is correct and hasn't expired
2. **Check Permissions**: Ensure your token has the required permissions
3. **Check Internet**: Verify your internet connection is stable
4. **GitHub Status**: Check [GitHub Status](https://www.githubstatus.com/) for outages

### Repository Access Issues

If you can't access repositories:

1. **Token Permissions**: Verify your token has repo permissions
2. **Repository Visibility**: Ensure repositories are accessible to your account
3. **Organization Settings**: Check if you're part of any organizations with restrictions

### Token Expired

If your token has expired:

1. **Generate New Token**: Create a new token with the same permissions
2. **Update Configuration**: Replace the old token in Ledger Entry
3. **Test Connection**: Verify the new token works correctly

## Next Steps

After setting up GitHub integration:

1. [Create your first repository](create-repository.md)
2. [Learn the command system](../commands/overview.md)
3. [Start adding transactions](../commands/transactions.md)
4. [Set up account structures](../commands/accounts.md)

## Additional Resources

- [GitHub Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Repository Security](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings)
- [Ledger Entry Repository Structure](../getting-started/repository-structure.md)
