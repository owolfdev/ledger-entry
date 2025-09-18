import type { Command, CommandContext, CommandResult } from "../../types";

export const rulesCommand: Command = {
  name: "rules",
  description: "List rule files in /rules folder",
  usage: "rules",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
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
  },
};
