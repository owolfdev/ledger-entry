/**
 * Local storage utilities for persisting user preferences and state
 */

const STORAGE_KEYS = {
  LAST_LOADED_FILE: "ledger_last_loaded_file",
  LAST_LOADED_FILE_PATH: "ledger_last_loaded_file_path",
} as const;

export interface StoredFileInfo {
  path: string;
  name: string;
  timestamp: number;
}

/**
 * Save the last loaded file information to localStorage
 */
export function saveLastLoadedFile(fileInfo: StoredFileInfo): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      STORAGE_KEYS.LAST_LOADED_FILE,
      JSON.stringify(fileInfo)
    );
  } catch (_error) {
    // console.warn("Failed to save last loaded file to localStorage:", error);
  }
}

/**
 * Get the last loaded file information from localStorage
 */
export function getLastLoadedFile(): StoredFileInfo | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_LOADED_FILE);
    if (!stored) return null;

    const fileInfo = JSON.parse(stored) as StoredFileInfo;

    // Check if the stored data is not too old (e.g., within 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    if (fileInfo.timestamp < thirtyDaysAgo) {
      // Clear old data
      localStorage.removeItem(STORAGE_KEYS.LAST_LOADED_FILE);
      return null;
    }

    return fileInfo;
  } catch (_error) {
    // console.warn("Failed to get last loaded file from localStorage:", error);
    return null;
  }
}

/**
 * Clear the last loaded file information from localStorage
 */
export function clearLastLoadedFile(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.LAST_LOADED_FILE);
  } catch (_error) {
    // console.warn("Failed to clear last loaded file from localStorage:", error);
  }
}
