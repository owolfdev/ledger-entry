# **Ledger Entry — Full Specification v1.0**

**Owner:** OWolf / Ledger Entry
**Status:** Draft for Implementation (Phase-0)
**Scope:** A GitHub-backed, Ledger-CLI–powered web app with natural language input, multi-entity accounts, and user-managed rules.

---

## 1. Objectives

- Provide a **web-based interface** to create and manage Ledger CLI transactions stored entirely in each user’s **own private GitHub repo**.
- Let users **enter natural language prompts** that are interpreted into Ledger-style entries.
- Keep the app **human-readable and Git-friendly**: everything is text-based and versioned.
- Support **multi-entity, multi-currency**, and **locale-specific templates**.
- Use a **Ledger CLI microservice** to generate reports, never storing financial data server-side.

---

## 2. Core Architecture Overview

### Components

- **Web App (Next.js + Supabase)**: UI for login, input, rules config, file browsing, and reports.
- **Backend API**:

  - Authenticates with GitHub using OAuth.
  - Vaults the user’s Personal Access Token (PAT).
  - Manages repo creation/updates and file commits.
  - Fetches files from GitHub to send to the Ledger Runner.

- **Ledger Runner Microservice (DigitalOcean)**:

  - Containerized service with Ledger CLI installed.
  - Receives file payloads (not PATs).
  - Runs whitelisted Ledger commands and streams results back.

- **GitHub Repos (per user)**:

  - Stores `.journal` files, `accounts.journal`, and `rules/*.json`.
  - User owns repo and data.

### Data Flow

```
User → Web App → Backend → GitHub (fetch files) → Ledger Runner (compute) → Web App (display results)
```

---

## 3. User Onboarding Flow

1. **Sign up / Login via GitHub** (OAuth; collect profile only).
2. **Collect Setup Info**: location, default currency, choose starter template.
3. **Prompt for PAT** (with `repo` scope).
4. **Create or Connect Repo**:

   - App creates `ledger-entry` repo or lets user pick an existing repo.
   - Push starter files (`main.journal`, `accounts.journal`, `journals/YYYY-MM.journal`, `rules` folder).

5. **User Lands in App**:

   - Can immediately type a prompt → get a draft Ledger entry → review/edit → save to repo.

---

## 4. GitHub Repo Structure (Phase-0)

```
my-ledger/
├─ main.journal
├─ accounts.journal
├─ journals/
│  ├─ 2025-09.journal
│  ├─ 2025-10.journal
│  └─ ...
└─ rules/
   ├─ 00-base.json
   ├─ 10-templates.json
   ├─ 20-user.json
   └─ 30-learned.json
```

- **main.journal** — includes `accounts.journal` and the current month’s journal files:

  ```
  !include accounts.journal
  !include journals/2025-09.journal
  ```

- **accounts.journal** — declares accounts and aliases.
- **journals/YYYY-MM.journal** — transaction files per month.
- **rules/** — JSON rules (precedence 30>20>10>00).

---

## 5. Ledger Files

### 5.1 `accounts.journal`

Defines Chart of Accounts and aliases. Example:

```
account Personal:Assets:Bank:KBank:Checking
account Personal:Assets:Cash
account Personal:Liabilities:CreditCard:Primary
account Personal:Expenses:Food:Coffee
alias coffee = Personal:Expenses:Food:Coffee
alias kbank  = Personal:Assets:Bank:KBank:Checking
```

### 5.2 Transactions

In `journals/YYYY-MM.journal`:

```
2025/09/15 Starbucks
    Personal:Expenses:Food:Coffee           100.00 THB
    Personal:Assets:Bank:KBank:Checking    -100.00 THB
```

---

## 6. Rules Engine (Files + Precedence)

### Files

- **00-base.json**: App defaults (read-only).
- **10-templates.json**: Locale starter (read-only).
- **20-user.json**: User-defined rules (UI edits).
- **30-learned.json**: Auto-learned rules (promoteable in UI).

### Precedence

```
30-learned.json (highest)
20-user.json
10-templates.json
00-base.json (lowest)
```

### JSON Schema (simplified)

```json
{
  "defaults": {
    "entity": "Personal",
    "currency": "THB",
    "fallbackCredit": "Personal:Assets:Bank:KBank:Checking"
  },
  "items": [
    {
      "pattern": "(?i)coffee|latte",
      "debit": "Personal:Expenses:Food:Coffee",
      "priority": 10
    }
  ],
  "merchants": [
    {
      "pattern": "(?i)starbucks",
      "defaultDebit": "Personal:Expenses:Food:Coffee"
    }
  ],
  "payments": [
    {
      "pattern": "(?i)kbank|kasikorn",
      "credit": "Personal:Assets:Bank:KBank:Checking"
    }
  ]
}
```

---

## 7. Natural Language Interpreter (NLP Layer)

### Steps

1. **Tokenize input**: detect items, amounts, merchant, payment hint, currency.
2. **Apply rules**: items → debit accounts; merchant → default debit; payment hint → credit account.
3. **Fallback**: use defaults if no match.
4. **Validate**: accounts exist; balanced transaction.
5. **Output draft entry** in Ledger syntax.

### Example

Input:
`coffee 100 Starbucks`

Draft:

```
2025/09/09 Starbucks
    Personal:Expenses:Food:Coffee           100.00 THB
    Personal:Assets:Bank:KBank:Checking    -100.00 THB
```

User can edit before saving.

---

## 8. Multi-Currency Support

- Default currency from `defaults.currency`.
- Accept explicit currency in input (`USD`, `$`, `฿`).
- Post as either:

  - Transaction currency only (simplest), or
  - Dual-amount with cost `@@` for immediate functional totals:

    ```
    2025/09/15 Amazon US
        Personal:Expenses:Shopping           3.00 USD @@ 110.00 THB
        Personal:Liabilities:CreditCard     -3.00 USD
    ```

- Optional `prices.prices` for daily FX rates.

---

## 9. Multilingual Support

- UTF-8 throughout (accounts, payees, comments).
- Account paths in English or native script; use `alias` to bridge.
- Rules JSON can have multilingual regex patterns.
- Normalize input to Unicode NFKC.
- Keep file/folder names ASCII but allow multilingual content inside.

---

## 10. Ledger Runner Microservice

### Overview

- Containerized on DigitalOcean Droplet or App Platform.
- Always warm (no cold start).
- Receives **file payload** (not PAT).
- Runs whitelisted Ledger commands: `bal`, `reg`, `stats`.

### Request Shape

```json
POST /ledger/run
{
  "files": [
    {"path":"journals/2025-09.journal","contentBase64":"..."},
    {"path":"accounts.journal","contentBase64":"..."}
  ],
  "main": "main.journal",
  "command": "bal",
  "args": ["-p","2025-09","^Assets","--flat"]
}
```

### Runner Security

- Tmpfs for files.
- Timeout per request (e.g., 8s).
- Delete temp files after run.
- Return stdout/stderr in JSON.

---

## 11. GitHub Token Vaulting

- PAT stored **server-side encrypted** (DB + KMS/secret).
- Decrypt only to talk to GitHub from backend.
- Runner never receives PAT.
- Scope: minimal (`repo`).

---

## 12. User Flow (Phase-0)

1. User logs in via GitHub.
2. User chooses location/currency → picks a starter template.
3. User pastes PAT → app verifies & vaults it.
4. App creates private repo with starter files.
5. User enters prompt:

   - Interpreter → draft entry → textarea.
   - User edits → Save → appended to month file in repo.

6. User runs Ledger CLI reports via the runner (optional).

---

## 13. Migration Flow (Import Existing Files)

- Option to **connect existing repo** and select main file.
- App scans includes & accounts.
- Compatibility Mode (use as-is) or Organize Mode (PR to add `accounts.journal` + monthly files).
- Auto-seed learned rules from history.

---

## 14. Rules UI Page

### Tabs

- **Items** (pattern → debit account).
- **Merchants** (pattern → default debit).
- **Payments** (pattern → credit account).
- **Defaults** (currency, fallback credit).
- **Learned** (promote or disable).
- **Test** (input box + “dry-run” preview).

### Features

- Account picker autocompletes from `accounts.journal`.
- Regex helper + live tester.
- Save commits to `rules/20-user.json`.
- Promoting from `30-learned.json` auto-commits to `20-user.json`.

---

## 15. Validation Rules

- Transaction must balance within one entity.
- Post to **leaf accounts** only.
- Block cross-entity lines.
- If account missing, prompt “Create account” before saving.
- Optional VAT guardrails (phase-1).

---

## 16. Security and Privacy

- No financial data stored server-side beyond encrypted PATs.
- Runner receives file payloads only.
- Logs scrubbed of sensitive content.
- HTTPS everywhere.
- User can revoke PAT at any time.

---

## 17. Phase Roadmap

**Phase-0 (MVP)**

- GitHub OAuth + PAT vaulting.
- Repo bootstrap (main/accounts/journals/rules).
- NL interpreter + textarea editing + Save.
- Ledger runner microservice.
- Rules page basic editor.
- Multi-currency (dual-amount).
- Multilingual input support.

**Phase-1**

- Optional DB mirror for analytics and cross-device caching.
- Period locks and VAT remittance support.
- OCR receipts & attachments.
- GitHub App installation (short-lived tokens).
- Price database management.
- Template gallery for multiple locales/business types.

---

## 18. Developer Guidelines

- Keep everything **plain text, UTF-8**.
- **Stable formatting** for entries (two spaces indent, right-align amounts).
- **Atomic commits** to GitHub with SHA check.
- **Clear commit messages**.
- **No silent transformations**: always preview draft entry before saving.

---

## 19. Example Starter Files

**main.journal**

```
; Ledger Entry — main
!include accounts.journal
!include journals/2025-09.journal
```

**accounts.journal**

```
account Personal:Assets:Bank:KBank:Checking
account Personal:Assets:Cash
account Personal:Liabilities:CreditCard:Primary
account Personal:Expenses:Food:Coffee
alias coffee = Personal:Expenses:Food:Coffee
alias kbank  = Personal:Assets:Bank:KBank:Checking
```

**rules/00-base.json**

```json
{
  "version": "1.0",
  "defaults": {
    "entity": "Personal",
    "currency": "THB",
    "fallbackCredit": "Personal:Assets:Bank:KBank:Checking"
  },
  "items": [],
  "merchants": [],
  "payments": []
}
```

---

## 20. Key Design Principles

- **User data = user repo** (not your DB).
- **Plain text over proprietary** formats.
- **Transparency**: show how rules matched for each transaction.
- **Scalable**: per-user rules, per-user repo, microservice runner.
- **Portability**: everything can be cloned and used with vanilla Ledger CLI offline.

---

**Bottom line:**
Ledger Entry is a GitHub-backed, plain-text, multi-lingual, multi-currency ledger system with a natural-language input layer and a cloud-based Ledger CLI runner. The spec above gives you the entire architecture, file formats, and user flow to start building confidently.

---

## 🔹 Storage at GitHub (Journal + Rules)

### 1. **Each User Has Their Own Private Repo**

- Created automatically by the app using their PAT (or user can point to an existing repo).
- Repo contains **all financial data and rules** — nothing stored on your servers beyond the encrypted PAT.

---

### 2. **File Structure**

```
my-ledger/             ← user’s GitHub repo
├─ main.journal        ← root file with !include lines
├─ accounts.journal    ← chart of accounts + aliases
├─ journals/            ← one file per month of transactions
│  ├─ 2025-09.journal
│  ├─ 2025-10.journal
│  └─ ...
└─ rules/              ← JSON rules with precedence
   ├─ 00-base.json
   ├─ 10-templates.json
   ├─ 20-user.json
   └─ 30-learned.json
```

---

### 3. **Journal Files**

- **`main.journal`**
  Lists includes. Ledger CLI is always run against this file:

  ```
  !include accounts.journal
  !include journals/2025-09.journal
  ```

- **`accounts.journal`**
  Predefines accounts and aliases; also optional Ledger rules.

- **`journals/YYYY-MM.journal`**
  App appends each new entry here (one per month or year).
  On save, app fetches the file via GitHub API, appends text, and commits with a clear commit message.

---

### 4. **Rules Files**

- **`rules/00-base.json`**
  Global defaults shipped by app (read-only).

- **`rules/10-templates.json`**
  Locale/business starter pack selected at signup (read-only).

- **`rules/20-user.json`**
  User-editable rules from the Rules Config Page.

- **`rules/30-learned.json`**
  Auto-learned rules appended by the app based on confirmations; user can promote or disable.

**Precedence:** `30-learned` > `20-user` > `10-templates` > `00-base`.

---

### 5. **GitHub Commit Workflow**

- App uses **GitHub Contents API**:

  - `GET /repos/:owner/:repo/contents/:path` to get `sha`.
  - Modify or append file locally.
  - `PUT /repos/:owner/:repo/contents/:path` with `sha` and commit message.

- Commit messages examples:

  - `entry: 2025/09/09 Starbucks — Personal (THB 100)`
  - `rules: update user rules`
  - `bootstrap: add starter ledger files`

- If file doesn’t exist (new month), app **creates** it and **updates `main.journal`** with a new `!include` line.

---

### 6. **Token Safety**

- PAT stored **server-side encrypted** (Supabase DB + KMS).
- Only backend fetches from GitHub using decrypted PAT.
- Ledger Runner receives **files payload only**, never PAT.

---

### 7. **Migration of Existing Files**

- If user already has Ledger files:

  - App connects to their repo using PAT.
  - Lets them pick a `main.journal` or equivalent.
  - Compatibility mode (use as-is) or organize mode (PR to adopt our structure).

---

### 8. **Key Principles**

- **Human-readable, Git-diffable** text files.
- **One source of truth** per user — their GitHub repo.
- **No database mirror** in Phase-0 — everything pulled live from GitHub on demand.

---

So the spec does clearly say:

- **Where** journal files and rules live (in the user’s own GitHub repo),
- **How** they’re structured,
- **How** your app reads/writes them via the GitHub API,
- **How** precedence and rules files work,
- **How** security is handled with PAT vaulting.
