import { GitHubClient } from "../github/client";

export interface LedgerRepoStructure {
  hasMainJournal: boolean;
  hasAccountsJournal: boolean;
  hasEntriesFolder: boolean;
  hasRulesFolder: boolean;
  isCompatible: boolean;
  missingFiles: string[];
  missingFolders: string[];
}

export interface RepoInfo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  ledgerStructure?: LedgerRepoStructure;
}

/**
 * Scans a repository to check if it has the required ledger file structure
 */
export async function scanLedgerStructure(
  githubClient: GitHubClient,
  owner: string,
  repo: string
): Promise<LedgerRepoStructure> {
  const missingFiles: string[] = [];
  const missingFolders: string[] = [];

  try {
    // Check for main.journal
    const mainJournal = await githubClient.getFile(owner, repo, "main.journal");
    const hasMainJournal = !!mainJournal;

    // Check for accounts.journal
    const accountsJournal = await githubClient.getFile(
      owner,
      repo,
      "accounts.journal"
    );
    const hasAccountsJournal = !!accountsJournal;

    // Check for entries/ folder (look for any file in entries/)
    const entriesFiles = await githubClient.getDirectoryContents(
      owner,
      repo,
      "entries"
    );
    const hasEntriesFolder = entriesFiles.length > 0;

    // Check for rules/ folder (look for any file in rules/)
    const rulesFiles = await githubClient.getDirectoryContents(
      owner,
      repo,
      "rules"
    );
    const hasRulesFolder = rulesFiles.length > 0;

    // Track missing items
    if (!hasMainJournal) missingFiles.push("main.journal");
    if (!hasAccountsJournal) missingFiles.push("accounts.journal");
    if (!hasEntriesFolder) missingFolders.push("entries/");
    if (!hasRulesFolder) missingFolders.push("rules/");

    const isCompatible =
      hasMainJournal &&
      hasAccountsJournal &&
      hasEntriesFolder &&
      hasRulesFolder;

    return {
      hasMainJournal,
      hasAccountsJournal,
      hasEntriesFolder,
      hasRulesFolder,
      isCompatible,
      missingFiles,
      missingFolders,
    };
  } catch (error) {
    console.error(`Error scanning repo ${owner}/${repo}:`, error);
    return {
      hasMainJournal: false,
      hasAccountsJournal: false,
      hasEntriesFolder: false,
      hasRulesFolder: false,
      isCompatible: false,
      missingFiles: ["main.journal", "accounts.journal"],
      missingFolders: ["entries/", "rules/"],
    };
  }
}

/**
 * Scans all user repositories for ledger compatibility
 */
export async function scanUserRepositories(
  githubClient: GitHubClient
): Promise<RepoInfo[]> {
  try {
    console.log("Starting repository scan...");
    const repos = await githubClient.getUserRepositories();
    console.log(`Found ${repos.length} repositories to scan`);

    // Limit scanning to first 20 repos to avoid rate limits
    const reposToScan = repos.slice(0, 20);
    console.log(
      `Scanning ${reposToScan.length} repositories (limited to avoid rate limits)`
    );

    // Scan each repo for ledger structure
    const reposWithStructure = await Promise.all(
      reposToScan.map(async (repo, index) => {
        console.log(
          `Scanning repo ${index + 1}/${reposToScan.length}: ${repo.name}`
        );
        const [owner, repoName] = repo.full_name.split("/");
        const ledgerStructure = await scanLedgerStructure(
          githubClient,
          owner,
          repoName
        );

        return {
          ...repo,
          ledgerStructure,
        };
      })
    );

    // Add remaining repos without scanning (they'll show as incompatible)
    const remainingRepos = repos.slice(20).map((repo) => ({
      ...repo,
      ledgerStructure: {
        hasMainJournal: false,
        hasAccountsJournal: false,
        hasEntriesFolder: false,
        hasRulesFolder: false,
        isCompatible: false,
        missingFiles: ["main.journal", "accounts.journal"],
        missingFolders: ["entries/", "rules/"],
      },
    }));

    const allRepos = [...reposWithStructure, ...remainingRepos];
    console.log(`Repository scan complete: ${allRepos.length} total repos`);
    return allRepos;
  } catch (error) {
    console.error("Error scanning user repositories:", error);
    return [];
  }
}

/**
 * Filters repositories to show only compatible ones
 */
export function getCompatibleRepos(repos: RepoInfo[]): RepoInfo[] {
  return repos.filter((repo) => repo.ledgerStructure?.isCompatible);
}

/**
 * Filters repositories to show only incompatible ones
 */
export function getIncompatibleRepos(repos: RepoInfo[]): RepoInfo[] {
  return repos.filter((repo) => !repo.ledgerStructure?.isCompatible);
}
