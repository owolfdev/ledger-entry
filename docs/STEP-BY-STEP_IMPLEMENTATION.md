[1 tool called]

# **Ledger Entry — Complete Step-by-Step Implementation Plan**

## **Current State Analysis**

- ✅ Next.js 15 app with Monaco Editor
- ✅ Basic ledger file editing with syntax highlighting
- ✅ Terminal interface with mock commands
- ✅ Vim mode support and responsive UI
- ✅ Supabase authentication infrastructure
- ✅ GitHub OAuth authentication (sign up/sign in working)
- ✅ User profile management with GitHub data
- ✅ GitHub repository creation and management
- ✅ GitHub file operations (CRUD via Contents API)
- ✅ Ledger file structure initialization
- ✅ Repository scanning and structure detection
- ✅ Basic ledger templates system
- ✅ Repository connection and setup workflow
- ❌ Natural language processing interpreter
- ❌ Rules engine implementation
- ❌ Account management system
- ❌ Transaction preview and editing

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

### **Step 2.5: GitHub Repository Management** ✅ **COMPLETED**

**Priority: High | Time: 2-3 days**

**What was built:**

- GitHub OAuth integration with repository scope
- GitHub repository creation and management
- Repository file operations (CRUD via Contents API)
- Repository scanning and structure detection
- Ledger file structure initialization
- Basic ledger templates system

**Implemented files:**

```
src/app/api/
├── github/
│   ├── create-repository/route.ts    ← Create new repos
│   ├── repositories/route.ts          ← List user repositories
│   ├── ledger-files/route.ts         ← Initialize ledger structure
│   └── check-compatibility/route.ts  ← Check repo compatibility

src/lib/
├── github/
│   ├── client.ts                     ← GitHub API client
│   ├── server.ts                     ← Server-side GitHub client
│   └── token-handler.ts              ← OAuth token management
├── ledger/
│   ├── file-initializer.ts           ← Initialize repo structure
│   ├── repo-scanner.ts               ← Scan existing repos
│   ├── structure.ts                  ← Generate ledger structure
│   └── templates.ts                  ← Ledger templates

src/components/
├── github-setup-guide.tsx            ← Setup instructions
├── repository-list.tsx               ← Repository selection
└── ledger/
    ├── repo-selection.tsx            ← Repository connection
    └── repo-status-card.tsx          ← Repository status
```

**Key features implemented:**

- ✅ GitHub OAuth with repository scope
- ✅ Repository creation and management
- ✅ File operations (read, create, update, delete) via GitHub Contents API
- ✅ Ledger file structure initialization
- ✅ Repository scanning and compatibility checking
- ✅ Basic ledger templates system
- ✅ Repository connection and setup workflow

**Success Criteria:**

- ✅ User can authenticate with GitHub OAuth
- ✅ User can create new repositories
- ✅ User can connect to existing repositories
- ✅ User can read/write files in their chosen repository
- ✅ Ledger file structure is automatically initialized
- ✅ All operations work with proper error handling

---

### **Step 3: Ledger Repository Structure Initialization** ✅ **COMPLETED**

**Priority: High | Time: 2-3 days**

**What was built:**

- Ledger file structure initialization in user's GitHub repo
- Repository creation/connection workflow
- Starter file templates (main.journal, accounts.journal, entries/, rules/)
- Git commit workflow with proper commit messages

**Implemented files:**

```
src/lib/ledger/
├── file-initializer.ts   ← Initialize repo structure
├── structure.ts          ← Generate ledger structure
├── templates.ts          ← Ledger templates
└── repo-scanner.ts       ← Scan existing repos

src/components/ledger/
├── repo-selection.tsx    ← Repository connection
├── repo-status-card.tsx  ← Repository status
└── create-repo-form.tsx  ← Repository creation
```

**Key features implemented:**

- ✅ Auto-create `ledger-entry` repo or connect existing
- ✅ Initialize proper file structure per spec
- ✅ SHA-based file updates via GitHub API
- ✅ Clear commit messages for file operations
- ✅ Template selection based on user preferences
- ✅ Repository scanning and compatibility checking

**Success Criteria:**

- ✅ User can create new repositories with ledger structure
- ✅ User can connect to existing repositories
- ✅ Ledger file structure is automatically initialized
- ✅ All files are properly committed to GitHub
- ✅ Repository structure follows the specification

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

### **Step 5: Natural Language Interpreter** ⭐ **CURRENT PRIORITY**

**Priority: High | Time: 4-5 days**

**What to build:**

- Input tokenization (amounts, merchants, items, currencies)
- Pattern matching against rules engine
- Account resolution and validation
- **Draft transaction generation for user review/editing**

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

- Parse: `coffee 100 Starbucks` → **Draft ledger entry**
- Multi-currency support with dual-amount syntax
- Account validation and balance checking
- **Generate draft for user review/editing before manual submission**
- **User can edit the generated entry before saving**

---

### **Step 6: Rules Engine Implementation** ⭐ **CURRENT PRIORITY**

**Priority: High | Time: 3-4 days**

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
- ✅ User connects to GitHub repository (OAuth-based)
- ✅ User can create and manage ledger repositories
- ✅ Ledger file structure is automatically initialized
- ❌ User enters natural language: `coffee 100 Starbucks`
- ❌ System generates draft transaction with proper accounts
- ❌ User saves transaction to GitHub with clear commit message
- ❌ User runs ledger commands (`balance`, `register`) via microservice
- ❌ User manages rules through dedicated UI
- ❌ Multi-currency transactions work correctly
- ✅ All data stored in user's GitHub repo (no server-side storage)

**Current Progress:**

- **Completed:** GitHub OAuth authentication, user profile management, repository management, ledger file structure initialization
- **In Progress:** Natural language processing and rules engine development
- **Next:** Account management system and transaction preview/editing

## **Immediate Next Steps (Steps 5 & 6)**

### **1. Natural Language Interpreter (Step 5)**

**Priority: High | Time: 4-5 days**

**Key Implementation Files to Create:**

1. **`src/lib/nlp-interpreter.ts`** - Main interpreter logic
2. **`src/lib/tokenizer.ts`** - Input parsing and tokenization
3. **`src/lib/transaction-validator.ts`** - Transaction validation
4. **`src/components/transaction-preview/TransactionPreview.tsx`** - Preview component
5. **`src/components/transaction-preview/TransactionEditor.tsx`** - Editor component

**Core Features to Implement:**

- Parse natural language input: `coffee 100 Starbucks` → **Draft ledger entry**
- Multi-currency support with dual-amount syntax
- Account validation and balance checking
- **Generate draft for user review/editing before manual submission**
- **User can edit the generated entry before saving**
- Integration with existing ledger interface

### **2. Rules Engine Implementation (Step 6)**

**Priority: High | Time: 3-4 days**

**Key Implementation Files to Create:**

1. **`src/lib/rules-engine.ts`** - Main rules logic
2. **`src/lib/rule-matcher.ts`** - Pattern matching
3. **`src/lib/rule-validator.ts`** - Rule validation
4. **`src/app/rules/page.tsx`** - Rules management page
5. **`src/components/rules-editor/RulesEditor.tsx`** - Main rules interface

**Core Features to Implement:**

- JSON file management with precedence system
- Rule types: items, merchants, payments, defaults
- Pattern matching and conflict resolution
- Rules validation and testing
- Integration with GitHub file operations

### **3. Integration with Existing System**

**Key Integration Points:**

- Connect NLP interpreter with existing ledger interface
- Integrate rules engine with GitHub file operations
- Update Monaco Editor to support transaction preview
- Connect with existing repository management system

### **4. User Experience Flow**

1. User opens ledger interface (already working)
2. User types natural language: `coffee 100 Starbucks`
3. System parses input and applies rules
4. System generates **draft ledger entry** for review
5. User reviews and edits the generated entry
6. User manually submits the entry to the terminal input
7. System validates and saves the entry to GitHub repository
8. Entry is committed with proper commit message

### **5. Development Approach**

- Start with basic tokenization and parsing
- Implement simple rule matching
- Build transaction preview component
- Integrate with existing GitHub operations
- Add advanced features incrementally

This approach builds on your existing solid foundation of GitHub integration and ledger file management to create a complete natural language interface for ledger entry creation.
