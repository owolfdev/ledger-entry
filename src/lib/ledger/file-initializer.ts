import { GitHubClient } from "../github/client";

export interface InitializationResult {
  success: boolean;
  createdFiles: string[];
  createdFolders: string[];
  errors: string[];
}

/**
 * Initialize a repository with blank ledger file structure
 */
export async function initializeLedgerStructure(
  githubClient: GitHubClient,
  owner: string,
  repo: string
): Promise<InitializationResult> {
  const result: InitializationResult = {
    success: true,
    createdFiles: [],
    createdFolders: [],
    errors: [],
  };

  try {
    // Create blank main.journal
    const mainJournalContent = `; Ledger Entry — main journal file
!include accounts.journal
!include entries/2025-01.journal
`;

    await githubClient.createFile(
      owner,
      repo,
      "main.journal",
      mainJournalContent,
      "Initialize ledger structure: add main.journal"
    );
    result.createdFiles.push("main.journal");

    // Create blank accounts.journal
    const accountsJournalContent = `; Ledger Entry — chart of accounts
; Add your accounts here
; Example:
; account Personal:Assets:Bank:Checking
; account Personal:Expenses:Food
; alias coffee = Personal:Expenses:Food:Coffee
`;

    await githubClient.createFile(
      owner,
      repo,
      "accounts.journal",
      accountsJournalContent,
      "Initialize ledger structure: add accounts.journal"
    );
    result.createdFiles.push("accounts.journal");

    // Create entries folder and first month file
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const entriesContent = `; Ledger Entry — transactions for ${currentMonth}
; Add your transactions here
; Example:
; 2025/01/15 Example Transaction
;     Personal:Expenses:Food    10.00 USD
;     Personal:Assets:Bank     -10.00 USD
`;

    await githubClient.createFile(
      owner,
      repo,
      `entries/${currentMonth}.journal`,
      entriesContent,
      "Initialize ledger structure: add entries folder and first month file"
    );
    result.createdFiles.push(`entries/${currentMonth}.journal`);

    // Create rules folder and base files
    const baseRulesContent = `{
  "version": "1.0",
  "defaults": {
    "entity": "Personal",
    "currency": "USD",
    "fallbackCredit": "Personal:Assets:Bank:Checking"
  },
  "items": [],
  "merchants": [],
  "payments": []
}`;

    await githubClient.createFile(
      owner,
      repo,
      "rules/00-base.json",
      baseRulesContent,
      "Initialize ledger structure: add rules folder and base rules"
    );
    result.createdFiles.push("rules/00-base.json");

    // Create additional rule files
    const templateRulesContent = `{
  "version": "1.0",
  "items": [],
  "merchants": [],
  "payments": []
}`;

    await githubClient.createFile(
      owner,
      repo,
      "rules/10-templates.json",
      templateRulesContent,
      "Initialize ledger structure: add template rules"
    );
    result.createdFiles.push("rules/10-templates.json");

    await githubClient.createFile(
      owner,
      repo,
      "rules/20-user.json",
      templateRulesContent,
      "Initialize ledger structure: add user rules"
    );
    result.createdFiles.push("rules/20-user.json");

    await githubClient.createFile(
      owner,
      repo,
      "rules/30-learned.json",
      templateRulesContent,
      "Initialize ledger structure: add learned rules"
    );
    result.createdFiles.push("rules/30-learned.json");

    result.createdFolders.push("entries/", "rules/");
  } catch (error) {
    console.error("Error initializing ledger structure:", error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  return result;
}

/**
 * Add missing files to an existing repository
 */
export async function addMissingFiles(
  githubClient: GitHubClient,
  owner: string,
  repo: string,
  missingFiles: string[],
  missingFolders: string[]
): Promise<InitializationResult> {
  const result: InitializationResult = {
    success: true,
    createdFiles: [],
    createdFolders: [],
    errors: [],
  };

  try {
    // Add missing main.journal
    if (missingFiles.includes("main.journal")) {
      const mainJournalContent = `; Ledger Entry — main journal file
!include accounts.journal
!include entries/2025-01.journal
`;

      await githubClient.createFile(
        owner,
        repo,
        "main.journal",
        mainJournalContent,
        "Add missing main.journal file"
      );
      result.createdFiles.push("main.journal");
    }

    // Add missing accounts.journal
    if (missingFiles.includes("accounts.journal")) {
      const accountsJournalContent = `; Ledger Entry — chart of accounts
; Add your accounts here
`;

      await githubClient.createFile(
        owner,
        repo,
        "accounts.journal",
        accountsJournalContent,
        "Add missing accounts.journal file"
      );
      result.createdFiles.push("accounts.journal");
    }

    // Add missing entries folder and first month file
    if (missingFolders.includes("entries/")) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const entriesContent = `; Ledger Entry — transactions for ${currentMonth}
; Add your transactions here
`;

      await githubClient.createFile(
        owner,
        repo,
        `entries/${currentMonth}.journal`,
        entriesContent,
        "Add missing entries folder and first month file"
      );
      result.createdFiles.push(`entries/${currentMonth}.journal`);
      result.createdFolders.push("entries/");
    }

    // Add missing rules folder and files
    if (missingFolders.includes("rules/")) {
      const baseRulesContent = `{
  "version": "1.0",
  "defaults": {
    "entity": "Personal",
    "currency": "USD",
    "fallbackCredit": "Personal:Assets:Bank:Checking"
  },
  "items": [],
  "merchants": [],
  "payments": []
}`;

      await githubClient.createFile(
        owner,
        repo,
        "rules/00-base.json",
        baseRulesContent,
        "Add missing rules folder and base rules"
      );
      result.createdFiles.push("rules/00-base.json");
      result.createdFolders.push("rules/");

      // Add other rule files
      const templateRulesContent = `{
  "version": "1.0",
  "items": [],
  "merchants": [],
  "payments": []
}`;

      const ruleFiles = [
        "10-templates.json",
        "20-user.json",
        "30-learned.json",
      ];
      for (const ruleFile of ruleFiles) {
        await githubClient.createFile(
          owner,
          repo,
          `rules/${ruleFile}`,
          templateRulesContent,
          `Add missing ${ruleFile}`
        );
        result.createdFiles.push(`rules/${ruleFile}`);
      }
    }
  } catch (error) {
    console.error("Error adding missing files:", error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  return result;
}
