import type { Command, CommandContext, CommandResult } from "../../types";

export const journalsCommand: Command = {
  name: "journals",
  description: "List journal files in /journals folder",
  usage: "journals",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
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

    context.updateMessage(`Found ${journalFiles.length} journal files`, "info");

    return {
      success: true,
      message: `Found ${journalFiles.length} journal files`,
    };
  },
};
