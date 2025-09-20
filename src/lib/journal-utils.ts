/**
 * Journal file utilities for finding and managing journal files
 */

export interface RepositoryItem {
  name: string;
  path: string;
  type: string;
}

/**
 * Find journal files in the repository
 */
export function findJournalFiles(
  repositoryItems: RepositoryItem[]
): RepositoryItem[] {
  return repositoryItems.filter(
    (item) =>
      item.path.startsWith("journals/") &&
      item.type === "file" &&
      item.name.endsWith(".journal")
  );
}

/**
 * Parse journal date from filename
 * Expected format: YYYY-MM.journal
 */
export function parseJournalDate(filename: string): Date | null {
  const match = filename.match(/^(\d{4})-(\d{2})\.journal$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Convert to 0-indexed month

  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
    return null;
  }

  return new Date(year, month, 1);
}

/**
 * Find the latest journal file by date
 */
export function findLatestJournalFile(
  repositoryItems: RepositoryItem[]
): string | null {
  const journalFiles = findJournalFiles(repositoryItems);

  if (journalFiles.length === 0) return null;

  // Find the most recent journal by date
  const filesWithDates = journalFiles
    .map((file) => ({ file, date: parseJournalDate(file.name) }))
    .filter((item) => item.date !== null)
    .sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());

  return filesWithDates.length > 0 ? filesWithDates[0].file.path : null;
}

/**
 * Find the current month's journal file
 */
export function findCurrentJournalFile(
  repositoryItems: RepositoryItem[]
): string | null {
  const journalFiles = findJournalFiles(repositoryItems);

  if (journalFiles.length === 0) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed month

  const currentFilename = `${currentYear}-${currentMonth
    .toString()
    .padStart(2, "0")}.journal`;

  const currentFile = journalFiles.find(
    (file) => file.name === currentFilename
  );

  return currentFile ? currentFile.path : null;
}
