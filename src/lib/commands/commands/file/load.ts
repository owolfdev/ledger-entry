import type { Command, CommandContext, CommandResult } from "../../types";

export const loadCommand: Command = {
  name: "load",
  description: "Load a file from repository",
  usage: "load <filepath>",
  validate: (args: string[]) => {
    if (args.length < 1) {
      return { valid: false, error: "Usage: load <filepath>" };
    }
    return { valid: true };
  },
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    const filePath = args.join(" ");

    // Add loading message
    const loadingLogId = Date.now().toString();
    context.logger.addLog(
      "loading",
      `📄 Loading file from repository: ${filePath}`
    );

    // Add intermediate progress message
    setTimeout(() => {
      context.logger.addLog(
        "info",
        `   → Fetching file content from GitHub API...`
      );
    }, 200);

    try {
      await context.fileOperations.loadFile(filePath);

      // Remove loading message and add success
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );
      context.setCurrentFilePath(filePath);
      context.logger.addLog("success", `Loaded file: ${filePath}`);
      context.updateMessage(`Loaded file: ${filePath}`, "success");

      return {
        success: true,
        message: `Loaded file: ${filePath}`,
      };
    } catch (error) {
      // Remove loading message and add error
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
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
