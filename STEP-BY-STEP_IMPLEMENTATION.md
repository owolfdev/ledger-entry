[1 tool called]

# **Ledger Entry — Complete Step-by-Step Implementation Plan**

## **Current State Analysis**

- ✅ Next.js 15 app with Monaco Editor
- ✅ Basic ledger file editing with syntax highlighting
- ✅ Terminal interface with mock commands
- ✅ Vim mode support and responsive UI
- ❌ No backend infrastructure
- ❌ No GitHub integration
- ❌ No natural language processing
- ❌ No rules engine

---

## **Phase 0 Implementation Plan**

### **Step 1: Backend Infrastructure Setup**

**Priority: High | Time: 2-3 days**

**What to build:**

- Supabase project setup for authentication and encrypted storage
- Next.js API routes for GitHub and Ledger operations
- Database schema for user profiles and encrypted PATs
- Environment configuration and security setup

**New files:**

```
src/app/api/
├── auth/
│   ├── route.ts          ← GitHub OAuth handlers
│   └── callback/
│       └── route.ts      ← OAuth callback
├── github/
│   ├── route.ts          ← GitHub API proxy
│   └── repo/
│       └── route.ts      ← Repository operations
└── ledger/
    └── run/
        └── route.ts      ← Ledger runner integration
```

**Dependencies to add:**

```json
{
  "@supabase/supabase-js": "^2.38.0",
  "next-auth": "^4.24.5",
  "crypto-js": "^4.2.0"
}
```

---

### **Step 2: GitHub Authentication & PAT Vaulting**

**Priority: High | Time: 2-3 days**

**What to build:**

- GitHub OAuth flow with proper scopes (`repo` access)
- PAT collection and server-side encryption
- User profile management
- Token refresh and validation

**New files:**

```
src/lib/
├── auth.ts               ← NextAuth configuration
├── github.ts             ← GitHub API client
└── encryption.ts         ← PAT encryption/decryption
```

**Key features:**

- Secure PAT storage using Supabase + encryption
- GitHub OAuth with minimal required scopes
- Token validation and refresh handling

---

### **Step 3: Repository Management System**

**Priority: High | Time: 3-4 days**

**What to build:**

- GitHub repository creation/connection
- File structure initialization (main.journal, accounts.journal, entries/, rules/)
- GitHub Contents API integration for file operations
- Git commit workflow with proper commit messages

**New files:**

```
src/lib/
├── github-repo.ts        ← Repository management
├── file-operations.ts    ← GitHub file CRUD
└── ledger-structure.ts   ← Initialize repo structure
```

**Key features:**

- Auto-create `ledger-entry` repo or connect existing
- Initialize proper file structure per spec
- SHA-based file updates via GitHub API
- Clear commit messages: `entry: 2025/09/09 Starbucks — Personal (THB 100)`

---

### **Step 4: Ledger CLI Microservice**

**Priority: High | Time: 2-3 days**

**What to build:**

- Containerized service on DigitalOcean
- Ledger CLI installation and configuration
- Secure API endpoints for ledger commands
- File-based input system (no PAT access)

**New files:**

```
ledger-runner/            ← Separate microservice
├── Dockerfile
├── src/
│   ├── server.ts         ← Express server
│   ├── ledger-client.ts  ← Ledger CLI wrapper
│   └── security.ts       ← Request validation
└── package.json
```

**Key features:**

- Whitelisted commands: `bal`, `reg`, `stats`
- File payload input only (no PATs)
- 8-second timeout per request
- Tmpfs for temporary files

---

### **Step 5: Natural Language Interpreter**

**Priority: High | Time: 4-5 days**

**What to build:**

- Input tokenization (amounts, merchants, items, currencies)
- Pattern matching against rules engine
- Account resolution and validation
- Draft transaction generation

**New files:**

```
src/lib/
├── nlp-interpreter.ts    ← Main interpreter logic
├── tokenizer.ts          ← Input parsing
└── transaction-validator.ts ← Validation logic

src/components/
└── transaction-preview/
    ├── TransactionPreview.tsx
    └── TransactionEditor.tsx
```

**Key features:**

- Parse: `coffee 100 Starbucks` → Draft transaction
- Multi-currency support with dual-amount syntax
- Account validation and balance checking
- Preview before save functionality

---

### **Step 6: Rules Engine Implementation**

**Priority: Medium | Time: 3-4 days**

**What to build:**

- JSON file management with precedence system
- Rule types: items, merchants, payments, defaults
- Pattern matching and conflict resolution
- Rules validation and testing

**New files:**

```
src/lib/
├── rules-engine.ts       ← Main rules logic
├── rule-matcher.ts       ← Pattern matching
└── rule-validator.ts     ← Rule validation

src/app/rules/
└── page.tsx              ← Rules management page

src/components/rules-editor/
├── RulesEditor.tsx       ← Main rules interface
├── RulePatternEditor.tsx ← Individual rule editing
├── RuleTester.tsx        ← Test patterns
└── RuleConflictResolver.tsx ← Handle conflicts
```

**Key features:**

- Precedence: `30-learned` > `20-user` > `10-templates` > `00-base`
- Regex pattern matching with live testing
- Rule conflict detection and resolution
- Promote learned rules to user rules

---

### **Step 7: Account Management System**

**Priority: Medium | Time: 2-3 days**

**What to build:**

- Account picker with autocomplete
- Chart of accounts editor
- Alias management
- Account validation

**New files:**

```
src/app/accounts/
└── page.tsx              ← Account management page

src/components/account-picker/
├── AccountPicker.tsx     ← Autocomplete component
├── AccountEditor.tsx     ← Create/edit accounts
└── AliasManager.tsx      ← Manage aliases
```

**Key features:**

- Autocomplete from `accounts.journal`
- Account creation with proper hierarchy
- Alias management and validation
- Integration with rules engine

---

### **Step 8: Enhanced User Interface**

**Priority: Medium | Time: 3-4 days**

**What to build:**

- File browser for journal files
- Settings page for user preferences
- Multi-language support (UTF-8)
- Improved transaction workflow

**New files:**

```
src/app/settings/
└── page.tsx              ← User settings page

src/components/
├── file-browser/
│   ├── FileBrowser.tsx   ← Browse journal files
│   └── FileEditor.tsx    ← Edit individual files
└── settings/
    ├── UserSettings.tsx  ← User preferences
    └── LocaleSettings.tsx ← Language/currency
```

**Key features:**

- Browse and edit individual journal files
- User preferences and locale settings
- UTF-8 support for multilingual content
- Improved transaction entry workflow

---

### **Step 9: Multi-Currency & Localization**

**Priority: Medium | Time: 2-3 days**

**What to build:**

- Currency detection in natural language
- Dual-amount transaction support
- Locale-specific templates
- Currency formatting

**New files:**

```
src/lib/
├── currency.ts           ← Currency detection/formatting
└── localization.ts       ← Locale support

src/components/
└── currency/
    ├── CurrencyPicker.tsx
    └── AmountInput.tsx
```

**Key features:**

- Detect currencies: `$`, `€`, `฿`, `USD`, `THB`
- Dual-amount syntax: `3.00 USD @@ 110.00 THB`
- Locale-specific number formatting
- Currency symbol recognition

---

### **Step 10: Testing & Deployment**

**Priority: High | Time: 2-3 days**

**What to build:**

- Unit tests for core functions
- Integration tests for GitHub and Ledger runner
- End-to-end tests for user flows
- Production deployment setup

**New files:**

```
tests/
├── unit/
├── integration/
└── e2e/

.github/workflows/
└── ci.yml               ← GitHub Actions

docker-compose.yml       ← Local development
Dockerfile              ← Production deployment
```

**Key features:**

- Comprehensive test coverage
- CI/CD pipeline setup
- Security testing for PAT handling
- Performance optimization

---

## **Updated File Structure**

```
src/
├── app/
│   ├── api/                    ← API routes
│   │   ├── auth/
│   │   ├── github/
│   │   └── ledger/
│   ├── rules/                  ← Rules management page
│   │   └── page.tsx
│   ├── accounts/               ← Account management page
│   │   └── page.tsx
│   ├── settings/               ← User settings page
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     ← Existing shadcn components
│   ├── rules-editor/           ← Rules editing components
│   ├── account-picker/         ← Account management components
│   ├── transaction-preview/    ← Transaction preview components
│   ├── file-browser/           ← File management components
│   ├── currency/               ← Currency components
│   └── ledger-interface.tsx    ← Existing main interface
├── lib/
│   ├── auth.ts                 ← Authentication
│   ├── github.ts               ← GitHub API client
│   ├── github-repo.ts          ← Repository management
│   ├── file-operations.ts      ← File CRUD operations
│   ├── ledger-structure.ts     ← Repo initialization
│   ├── nlp-interpreter.ts      ← Natural language processing
│   ├── rules-engine.ts         ← Rules management
│   ├── currency.ts             ← Currency handling
│   ├── encryption.ts           ← PAT encryption
│   └── utils.ts                ← Existing utilities
├── hooks/
│   ├── use-github.ts           ← GitHub operations
│   ├── use-ledger.ts           ← Ledger operations
│   ├── use-rules.ts            ← Rules management
│   └── use-settings.ts         ← Existing settings hook
└── styles/
    └── globals.css             ← Existing styles
```

---

## **Success Metrics for Phase 0**

- ✅ User authenticates with GitHub OAuth
- ✅ User creates/connects private ledger repository
- ✅ User enters natural language: `coffee 100 Starbucks`
- ✅ System generates draft transaction with proper accounts
- ✅ User saves transaction to GitHub with clear commit message
- ✅ User runs ledger commands (`balance`, `register`) via microservice
- ✅ User manages rules through dedicated UI
- ✅ Multi-currency transactions work correctly
- ✅ All data stored in user's GitHub repo (no server-side storage)

This plan transforms your current Monaco Editor interface into a complete GitHub-backed ledger application while maintaining the excellent editing experience you already have.
