# Ledger Entry Documentation

This directory contains all project documentation organized for both users and developers.

## Documentation Structure

### 👥 User Documentation (`/user/`)

Complete user guides and documentation for end users:

#### Getting Started

- [Introduction to Ledger Entry](./user/getting-started/introduction.md) - Overview of the application
- [Introduction to Ledger CLI](./user/getting-started/ledger-cli-basics.md) - Understanding the command-line interface
- [Creating Your First Repository](./user/getting-started/create-repository.md) - Step-by-step repository setup

#### Authentication

- [Authentication Overview](./user/authentication/overview.md) - Account security and management
- [Creating an Account](./user/authentication/sign-up.md) - How to create a new account
- [Signing In](./user/authentication/sign-in.md) - How to access your account
- [Forgot Password](./user/authentication/forgot-password.md) - Password recovery process

#### Configuration

- [Configuration Overview](./user/configuration/overview.md) - Setting up your Ledger Entry environment
- [GitHub Setup](./user/configuration/github-setup.md) - Connecting GitHub for repository storage

#### Commands Reference

- [Commands Overview](./user/commands/overview.md) - All available commands organized by category
- [Account & Balance Commands](./user/commands/account-balance.md) - Viewing account information and balances
- [File Management Commands](./user/commands/file-management.md) - Navigating and managing ledger files
- [Transaction Commands](./user/commands/transactions.md) - Adding and managing transactions
- [Utility Commands](./user/commands/utilities.md) - Validation and system maintenance

### 🛠️ Development Documentation (`/development/`)

Technical documentation for developers and contributors:

- [High-level Specification](./development/SPEC_FOR_LEDGER_APP.md) - Project overview and requirements
- [Accounts Specification](./development/SPEC_FOR_ACCOUNTS.md) - Account structure and management
- [Step-by-step Implementation](./development/STEP-BY-STEP_IMPLEMENTATION.md) - Development roadmap
- [Interface Guide](./development/INTERFACE_GUIDE.md) - UI/UX specifications
- [Keyboard Shortcuts](./development/KEYBOARD_SHORTCUTS.md) - Available keyboard shortcuts
- [Authentication Setup](./development/AUTH_SETUP.md) - Authentication system setup
- [GitHub Auth Setup](./development/GITHUB_AUTH_SETUP.md) - GitHub integration setup
- [Vercel Environment Setup](./development/VERCEL_ENV_SETUP.md) - Deployment configuration

### 📚 General Documentation

- [Interface Guide](./INTERFACE_GUIDE.md) - User interface documentation
- [Keyboard Shortcuts](./KEYBOARD_SHORTCUTS.md) - All available keyboard shortcuts

## Quick Start for Users

1. **Get Started**: Read the [Introduction to Ledger Entry](./user/getting-started/introduction.md)
2. **Create Account**: Follow the [Sign-up Guide](./user/authentication/sign-up.md)
3. **Set Up GitHub**: Configure [GitHub Integration](./user/configuration/github-setup.md)
4. **Create Repository**: Set up your [First Repository](./user/getting-started/create-repository.md)
5. **Learn Commands**: Explore the [Commands Reference](./user/commands/overview.md)

## Quick Start for Developers

Run the development server:

```bash
pnpm dev
```

Open `http://localhost:3000` and explore the [Development Documentation](./development/).

## Navigation

- **Users**: Start with [Introduction to Ledger Entry](./user/getting-started/introduction.md)
- **Developers**: Check the [High-level Specification](./development/SPEC_FOR_LEDGER_APP.md)
- **Contributors**: Review the [Implementation Plan](./development/STEP-BY-STEP_IMPLEMENTATION.md)
