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
    const timeoutId = setTimeout(() => {
      context.logger.addLog(
        "info",
        `   → Fetching file content from GitHub API...`
      );
    }, 200);
    context.logger.addTimeout(timeoutId);

    try {
      await context.fileOperations.loadFile(filePath);

      // Add editor loading message
      const editorLoadingLogId = Date.now().toString();
      context.logger.addLog("loading", "   → Applying content to editor...");

      // Simulate editor loading time
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Remove all loading messages and add success
      context.logger.setLogs(
        context.logger.logs.filter(
          (log) => log.id !== loadingLogId && log.id !== editorLoadingLogId
        )
      );
      context.setCurrentFilePath(filePath);
      context.logger.addLog("success", `Loaded file: ${filePath}`);
      context.updateMessage(`Loaded file: ${filePath}`, "success");

      return {
        success: true,
        message: `Loaded file: ${filePath}`,
      };
    } catch (error) {
      // Remove all loading messages and add error
      context.logger.setLogs(
        context.logger.logs.filter(
          (log) =>
            log.id !== loadingLogId &&
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
