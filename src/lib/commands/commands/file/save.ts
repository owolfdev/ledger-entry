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

    context.logger.addLog("success", `File saved: ${fileName}`);
    context.editor.setIsModified(false);
    context.updateMessage("File saved successfully!", "success");

    return {
      success: true,
      message: "File saved successfully!",
    };
  },
};
