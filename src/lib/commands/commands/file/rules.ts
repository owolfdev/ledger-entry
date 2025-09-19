import type { Command, CommandContext, CommandResult } from "../../types";

export const rulesCommand: Command = {
  name: "rules",
  description: "List rule files in /rules folder",
  usage: "rules",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    // Add loading message
    const loadingLogId = Date.now().toString();
    context.logger.addLog("loading", "⚙️ Scanning for rule files...");

    // Add intermediate progress message
    setTimeout(() => {
      context.logger.addLog("info", "   → Filtering files in /rules folder...");
    }, 150);

    try {
      // Simulate a small delay to show loading indicator
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Remove loading message
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );

      context.logger.addLog("info", "⚙️ Rule files in /rules folder:");

      const ruleFiles = context.repositoryItems.filter(
        (item) => item.path.startsWith("rules/") && item.type === "file"
      );

      if (ruleFiles.length === 0) {
        context.logger.addLog("info", "  No rule files found");
        context.logger.addLog(
          "info",
          "  Use 'add rule' to create a new rule file"
        );
      } else {
        ruleFiles
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((file) => {
            const icon = "📄";
            // Use the format that renderClickableContent expects for clickable files
            // Pattern must be: "  📄 filename.ext" (no file type suffix)
            context.logger.addLog("info", `  ${icon} ${file.name}`);
          });
        context.logger.addLog(
          "success",
          `📊 Found ${ruleFiles.length} rule files`
        );
      }

      context.updateMessage(`Found ${ruleFiles.length} rule files`, "info");

      return {
        success: true,
        message: `Found ${ruleFiles.length} rule files`,
      };
    } catch (error) {
      // Remove loading message and add error
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to list rule files";
      context.logger.addLog(
        "error",
        `Failed to list rule files: ${errorMessage}`
      );
      context.updateMessage("Failed to list rule files", "error");

      return {
        success: false,
        message: `Failed to list rule files: ${errorMessage}`,
      };
    }
  },
};
