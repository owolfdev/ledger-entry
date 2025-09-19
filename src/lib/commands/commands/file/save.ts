import type { Command, CommandContext, CommandResult } from "../../types";

export const saveCommand: Command = {
  name: "save",
  description: "Save current file",
  usage: "save",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    const fileName = context.fileOperations.currentFile?.path || "current file";
    const content = context.editor.ledgerContent;

    if (!context.fileOperations.currentFile) {
      context.logger.addLog("error", "No file loaded to save");
      context.updateMessage("No file loaded to save", "error");
      return {
        success: false,
        message: "No file loaded to save",
      };
    }

    // Add loading message
    const loadingLogId = Date.now().toString();
    context.logger.addLog("loading", `💾 Saving file: ${fileName}`);

    // Add intermediate progress message
    setTimeout(() => {
      context.logger.addLog("info", "   → Uploading changes to GitHub...");
    }, 200);

    try {
      await context.fileOperations.saveFile(content, `Update ${fileName}`);

      // Remove loading message and add success
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );
      context.editor.setIsModified(false);
      context.logger.addLog("success", `File saved: ${fileName}`);
      context.updateMessage("File saved successfully!", "success");

      return {
        success: true,
        message: "File saved successfully!",
      };
    } catch (error) {
      // Remove loading message and add error
      context.logger.setLogs(
        context.logger.logs.filter((log) => log.id !== loadingLogId)
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save file";
      context.logger.addLog("error", `Failed to save file: ${errorMessage}`);
      context.updateMessage("Failed to save file", "error");

      return {
        success: false,
        message: `Failed to save file: ${errorMessage}`,
      };
    }
  },
};
