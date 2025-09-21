import type { Command, CommandContext, CommandResult } from "../../types";
import { saveLastLoadedFile } from "@/lib/storage";

// Helper function to find journal files
function findJournalFiles(
  repositoryItems: Array<{ name: string; path: string; type: string }>
) {
  return repositoryItems.filter(
    (item) =>
      item.path.startsWith("journals/") &&
      item.type === "file" &&
      item.name.endsWith(".journal")
  );
}

// Helper function to parse journal date from filename
function parseJournalDate(filename: string): Date | null {
  // Expected format: YYYY-MM.journal
  const match = filename.match(/^(\d{4})-(\d{2})\.journal$/);
  if (!match) return null;

  const year = parseInt(match[1]);
  const month = parseInt(match[2]);

  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;

  return new Date(year, month - 1); // month is 0-indexed in Date constructor
}

// Helper function to parse month name to number
function parseMonthName(monthName: string): number | null {
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const monthAbbrevs = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  const lowerMonth = monthName.toLowerCase();

  // Check full month names
  const fullMonthIndex = monthNames.indexOf(lowerMonth);
  if (fullMonthIndex !== -1) return fullMonthIndex + 1;

  // Check abbreviated month names
  const abbrevMonthIndex = monthAbbrevs.indexOf(lowerMonth);
  if (abbrevMonthIndex !== -1) return abbrevMonthIndex + 1;

  return null;
}

// Helper function to find journal file by criteria
function findJournalFile(
  repositoryItems: Array<{ name: string; path: string; type: string }>,
  criteria: string
): string | null {
  const journalFiles = findJournalFiles(repositoryItems);

  if (journalFiles.length === 0) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed month

  switch (criteria) {
    case "current": {
      // Find current year-month journal
      const currentFilename = `${currentYear}-${currentMonth
        .toString()
        .padStart(2, "0")}.journal`;
      const currentFile = journalFiles.find(
        (file) => file.name === currentFilename
      );
      return currentFile ? currentFile.path : null;
    }

    case "latest": {
      // Find the most recent journal by date
      const filesWithDates = journalFiles
        .map((file) => ({ file, date: parseJournalDate(file.name) }))
        .filter((item) => item.date !== null)
        .sort(
          (a, b) => (b.date as Date).getTime() - (a.date as Date).getTime()
        );

      return filesWithDates.length > 0 ? filesWithDates[0].file.path : null;
    }

    default: {
      // Handle month names, numeric months, or year-month patterns
      let month: number | null = null;

      // Check if it's a month name (e.g., "september", "sep")
      const monthFromName = parseMonthName(criteria);
      if (monthFromName) {
        month = monthFromName;
      } else if (/^\d{1,2}$/.test(criteria)) {
        // Just month (1-12), find for current year
        month = parseInt(criteria);
        if (month < 1 || month > 12) return null;
      }

      if (month) {
        const filename = `${currentYear}-${month
          .toString()
          .padStart(2, "0")}.journal`;
        const file = journalFiles.find((f) => f.name === filename);

        // If file doesn't exist for current year, find latest from previous years
        if (!file) {
          const filesWithDates = journalFiles
            .map((file) => ({ file, date: parseJournalDate(file.name) }))
            .filter(
              (item) => item.date !== null && item.date.getMonth() + 1 === month
            )
            .sort(
              (a, b) => (b.date as Date).getTime() - (a.date as Date).getTime()
            );

          return filesWithDates.length > 0 ? filesWithDates[0].file.path : null;
        }

        return file.path;
      }

      if (/^\d{4}-\d{1,2}$/.test(criteria)) {
        // Year-month format (YYYY-MM)
        const filename = `${criteria}.journal`;
        const file = journalFiles.find((f) => f.name === filename);
        return file ? file.path : null;
      }

      return null;
    }
  }
}

export const loadCommand: Command = {
  name: "load",
  description:
    "Load a file from repository or use -j flag for journal shortcuts",
  usage:
    "load <filepath> | load -j [current|latest|<month>|<month-name>|<year-month>]",
  validate: (args: string[]) => {
    if (args.length < 1) {
      return {
        valid: false,
        error: "Usage: load <filepath> or load -j <journal>",
      };
    }

    // Check for journal flag
    if (args[0] === "-j") {
      if (args.length < 2) {
        return {
          valid: false,
          error:
            "Usage: load -j [current|latest|<month>|<month-name>|<year-month>]",
        };
      }

      const journalArg = args[1];

      // Check if it's a valid month name
      const monthFromName = parseMonthName(journalArg);
      const validPatterns = [
        "current",
        "latest",
        /^\d{1,2}$/,
        /^\d{4}-\d{1,2}$/,
      ];

      // Check for common invalid patterns that users might try
      if (journalArg.endsWith(".journal")) {
        return {
          valid: false,
          error:
            "Don't include '.journal' extension. Use: load -j 2025-09 (not 2025-09.journal)",
        };
      }

      if (
        monthFromName === null &&
        !validPatterns.some((pattern) =>
          pattern instanceof RegExp
            ? pattern.test(journalArg)
            : pattern === journalArg
        )
      ) {
        return {
          valid: false,
          error:
            "Invalid journal specifier. Use: current, latest, <month>, <month-name>, or <year-month>",
        };
      }
    }

    return { valid: true };
  },
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    let filePath: string;
    let displayPath: string;

    // Handle journal flag
    if (args[0] === "-j") {
      const journalCriteria = args[1];
      const resolvedPath = findJournalFile(
        context.repositoryItems,
        journalCriteria
      );

      if (!resolvedPath) {
        // Get available journal files for better error message
        const journalFiles = findJournalFiles(context.repositoryItems);
        const availableFiles = journalFiles
          .map((f) => f.name.replace(".journal", ""))
          .join(", ");

        context.logger.addLog(
          "error",
          `No journal file found for: ${journalCriteria}`
        );
        if (availableFiles) {
          context.logger.addLog(
            "info",
            `Available journal files: ${availableFiles}`
          );
        } else {
          context.logger.addLog(
            "info",
            "No journal files found in /journals folder"
          );
        }
        context.updateMessage(
          `No journal file found for: ${journalCriteria}`,
          "error"
        );
        return {
          success: false,
          message: `No journal file found for: ${journalCriteria}`,
        };
      }

      filePath = resolvedPath;
      displayPath = `journal (${journalCriteria})`;
    } else {
      filePath = args.join(" ");
      displayPath = filePath;

      // Check if the file exists in repository items
      const fileExists = context.repositoryItems.some(
        (item) => item.path === filePath && item.type === "file"
      );

      if (!fileExists) {
        context.logger.addLog("error", `File not found: ${filePath}`);
        context.logger.addLog(
          "info",
          "Use 'files' command to see available files"
        );
        context.updateMessage(`File not found: ${filePath}`, "error");
        return {
          success: false,
          message: `File not found: ${filePath}`,
        };
      }
    }

    // Add loading message
    context.logger.addLog(
      "loading",
      `📄 Loading file from repository: ${displayPath}`
    );

    // Add intermediate progress message
    const timeoutId = setTimeout(() => {
      context.logger.addLog(
        "info",
        `   → Fetching file content from GitHub API...`
      );
    }, 200);
    context.logger.addTimeout(timeoutId);

    try {
      await context.fileOperations.loadFile(filePath);

      context.logger.addLog("loading", "   → Applying content to editor");

      // Simulate editor loading time
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Remove all loading messages for this specific file load
      context.logger.setLogs(
        context.logger.logs.filter(
          (log) =>
            !log.message.includes(
              `Loading file from repository: ${displayPath}`
            ) &&
            !log.message.includes("Fetching file content from GitHub API") &&
            !log.message.includes("Applying content to editor")
        )
      );
      context.setCurrentFilePath(filePath);

      // Save to localStorage
      const fileName = filePath.split("/").pop() || "unknown";
      saveLastLoadedFile({
        path: filePath,
        name: fileName,
        timestamp: Date.now(),
      });

      context.logger.addLog("success", `Loaded file: ${filePath}`);
      context.updateMessage(`Loaded file: ${filePath}`, "success");

      return {
        success: true,
        message: `Loaded file: ${filePath}`,
      };
    } catch (error) {
      // Remove all loading messages for this specific file load
      context.logger.setLogs(
        context.logger.logs.filter(
          (log) =>
            !log.message.includes(
              `Loading file from repository: ${displayPath}`
            ) &&
            !log.message.includes("Fetching file content from GitHub API") &&
            !log.message.includes("Applying content to editor")
        )
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load file";
      context.logger.addLog("error", `Failed to load file: ${errorMessage}`);
      context.updateMessage("Failed to load file", "error");

      return {
        success: false,
        message: `Failed to load file: ${errorMessage}`,
      };
    }
  },
};
