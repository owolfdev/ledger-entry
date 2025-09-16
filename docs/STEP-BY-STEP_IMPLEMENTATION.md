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
- ❌ GitHub PAT collection and vaulting
- ❌ GitHub repository access and file operations
- ❌ Natural language processing
- ❌ Rules engine

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

### **Step 2.5: GitHub PAT Collection & Repository Access** ⭐ **CURRENT STEP**

**Priority: High | Time: 2-3 days**

**What to build:**

- GitHub Personal Access Token collection UI
- Supabase table for encrypted PAT storage
- PAT encryption/decryption utilities
- GitHub repository listing and access
- Repository file operations (CRUD)

**New files:**

```
src/app/api/
├── github/
│   ├── store-pat/
│   │   └── route.ts      ← Store encrypted PAT
│   ├── repos/
│   │   └── route.ts      ← List user repositories
│   └── files/
│       └── route.ts      ← File operations (CRUD)

src/lib/
├── github-client.ts      ← GitHub API client with PAT
├── pat-encryption.ts     ← Encrypt/decrypt PATs
└── github-repo.ts        ← Repository operations

src/components/
├── pat-collection/
│   ├── PATCollectionForm.tsx
│   ├── PATInstructions.tsx
│   └── RepositorySelector.tsx
└── github-setup/
    ├── GitHubSetupWizard.tsx
    └── RepositoryBrowser.tsx
```

**Database schema:**

```sql
-- Supabase table for encrypted PATs
CREATE TABLE user_github_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_pat TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_github_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can manage their own tokens" ON user_github_tokens
  FOR ALL USING (auth.uid() = user_id);
```

**Key features:**

- Secure PAT collection with clear instructions
- Server-side encryption using Supabase + environment secrets
- GitHub API integration for repository access
- File operations (read, create, update, delete) via GitHub Contents API
- Repository selection/creation workflow

**Implementation Details:**

1. **PAT Collection UI Flow:**

   - Show instructions for creating GitHub PAT with `repo` scope
   - Input form with validation and security warnings
   - Test PAT validity before storing
   - Clear success/error feedback

2. **Security Implementation:**

   - Use `crypto-js` for AES encryption
   - Store encryption key in environment variables
   - Never log or expose PATs in client-side code
   - Implement token refresh/validation

3. **GitHub API Integration:**

   - List user repositories with proper filtering
   - Support both public and private repos
   - Handle GitHub API rate limits and errors
   - Implement proper error handling and user feedback

4. **File Operations:**
   - Read file contents via GitHub Contents API
   - Create/update files with proper SHA handling
   - Delete files when needed
   - Handle binary files and encoding properly

**User Flow After PAT Collection:**

1. **Repository Selection:**

   - User sees list of their GitHub repositories
   - Option to create new `ledger-entry` repository
   - Option to connect existing repository
   - Repository validation (check if suitable for ledger files)

2. **Repository Setup:**

   - If new repo: initialize with starter files
   - If existing repo: scan for existing ledger files
   - Show repository structure and file browser
   - Allow user to configure main journal file

3. **Ready for Ledger Operations:**
   - User can now create/edit ledger files
   - Natural language input will be processed
   - Files will be committed to GitHub with proper messages
   - Ledger CLI operations will work with user's files

**Success Criteria:**

- ✅ User can store GitHub PAT securely
- ✅ User can access their GitHub repositories
- ✅ User can read/write files in their chosen repository
- ✅ All operations work with proper error handling
- ✅ User understands the security implications

---

### **Step 3: Ledger Repository Structure Initialization**

**Priority: High | Time: 2-3 days**

**What to build:**

- Ledger file structure initialization in user's GitHub repo
- Repository creation/connection workflow
- Starter file templates (main.journal, accounts.journal, entries/, rules/)
- Git commit workflow with proper commit messages

**New files:**

```
src/lib/
├── ledger-structure.ts   ← Initialize repo structure
├── file-templates.ts     ← Starter file templates
└── commit-utils.ts       ← Git commit message generation

src/components/
└── repo-setup/
    ├── RepoCreationWizard.tsx
    ├── FileStructurePreview.tsx
    └── TemplateSelector.tsx
```

**Key features:**

- Auto-create `ledger-entry` repo or connect existing
- Initialize proper file structure per spec
- SHA-based file updates via GitHub API
- Clear commit messages: `entry: 2025/09/09 Starbucks — Personal (THB 100)`
- Template selection based on user location/currency

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
- 🔄 User provides GitHub PAT and connects to repository
- ❌ User enters natural language: `coffee 100 Starbucks`
- ❌ System generates draft transaction with proper accounts
- ❌ User saves transaction to GitHub with clear commit message
- ❌ User runs ledger commands (`balance`, `register`) via microservice
- ❌ User manages rules through dedicated UI
- ❌ Multi-currency transactions work correctly
- ❌ All data stored in user's GitHub repo (no server-side storage)

**Current Progress:**

- **Completed:** GitHub OAuth authentication, user profile management
- **In Progress:** GitHub PAT collection and repository access
- **Next:** Ledger file structure initialization and natural language processing

## **Immediate Next Steps (Step 2.5)**

### **1. Create Supabase Table for PAT Storage**

Run this SQL in your Supabase SQL editor:

```sql
-- Create table for encrypted GitHub PATs
CREATE TABLE user_github_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_pat TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_github_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can manage their own tokens" ON user_github_tokens
  FOR ALL USING (auth.uid() = user_id);
```

### **2. Environment Variables**

Add to your `.env.local`:

```bash
# GitHub PAT encryption key (generate with: openssl rand -hex 32)
GITHUB_PAT_ENCRYPTION_KEY=your_32_character_hex_key_here
```

### **3. Key Implementation Files to Create**

1. **`src/lib/pat-encryption.ts`** - Encrypt/decrypt PATs
2. **`src/app/api/github/store-pat/route.ts`** - Store encrypted PAT
3. **`src/app/api/github/repos/route.ts`** - List user repositories
4. **`src/components/pat-collection/PATCollectionForm.tsx`** - PAT input UI
5. **`src/components/github-setup/GitHubSetupWizard.tsx`** - Setup flow

### **4. Security Considerations**

- **Never store PATs in plain text**
- **Use AES encryption with a strong key**
- **Validate PAT scope before storing (must have `repo` access)**
- **Implement token refresh/validation**
- **Clear error messages without exposing sensitive data**

### **5. User Experience Flow**

1. After GitHub OAuth, check if user has stored PAT
2. If no PAT, show PAT collection form with clear instructions
3. Test PAT validity before storing
4. Once PAT is stored, show repository selection
5. Initialize or connect to chosen repository
6. User is ready to use ledger features

This plan transforms your current Monaco Editor interface into a complete GitHub-backed ledger application while maintaining the excellent editing experience you already have.
