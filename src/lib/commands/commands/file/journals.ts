import type { Command, CommandContext, CommandResult } from "../../types";

export const journalsCommand: Command = {
  name: "journals",
  description: "List journal files in /journals folder",
  usage: "journals",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    // Add loading message
    const loadingLogId = Date.now().toString();
    context.logger.addLog("loading", "📚 Scanning for journal files...");

    // Add intermediate progress message
    setTimeout(() => {
      context.logger.addLog(
        "info",
        "   → Filtering files in /journals folder..."
      );
    }, 150);

    try {
      // Simulate a small delay to show loading indicator
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Remove loading message
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );

      context.logger.addLog("info", "📚 Journal files in /journals folder:");

      const journalFiles = context.repositoryItems.filter(
        (item) => item.path.startsWith("journals/") && item.type === "file"
      );

      if (journalFiles.length === 0) {
        context.logger.addLog("info", "  No journal files found");
        context.logger.addLog(
          "info",
          "  Use 'add journal' to create a new journal file"
        );
      } else {
        journalFiles
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((file) => {
            const icon = "📄";
            // Use the format that renderClickableContent expects for clickable files
            // Pattern must be: "  📄 filename.ext" (no file type suffix)
            context.logger.addLog("info", `  ${icon} ${file.name}`);
          });
        context.logger.addLog(
          "success",
          `📊 Found ${journalFiles.length} journal files`
        );
      }

      context.updateMessage(
        `Found ${journalFiles.length} journal files`,
        "info"
      );

      return {
        success: true,
        message: `Found ${journalFiles.length} journal files`,
      };
    } catch (error) {
      // Remove loading message and add error
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to list journal files";
      context.logger.addLog(
        "error",
        `Failed to list journal files: ${errorMessage}`
      );
      context.updateMessage("Failed to list journal files", "error");

      return {
        success: false,
        message: `Failed to list journal files: ${errorMessage}`,
      };
    }
  },
};
