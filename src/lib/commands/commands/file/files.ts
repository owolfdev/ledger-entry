import type { Command, CommandContext, CommandResult } from "../../types";

export const filesCommand: Command = {
  name: "files",
  description: "List all files in repository",
  usage: "files",
  execute: async (
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> => {
    context.logger.addLog("info", "📁 Repository structure:");

    if (context.repositoryItems.length === 0) {
      context.logger.addLog("info", "  No items found");
    } else {
      // Build a tree structure
      type TreeNode = {
        type: "dir" | "file";
        children?: { [key: string]: TreeNode };
      };

      const tree: { [key: string]: TreeNode } = {};

      // Process all items to build the tree
      context.repositoryItems.forEach((item) => {
        const parts = item.path.split("/");
        let current = tree;

        // Navigate/create the tree structure
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;

          if (!current[part]) {
            current[part] = {
              type: (isLast ? item.type : "dir") as "dir" | "file",
              children: isLast && item.type === "file" ? undefined : {},
            };
          }

          if (!isLast && current[part].children) {
            current = current[part].children!;
          }
        }
      });

      // Function to render tree recursively with better formatting
      const renderTree = (
        items: { [key: string]: TreeNode },
        indent = "  ",
        isRoot = true
      ) => {
        const sortedKeys = Object.keys(items).sort((a, b) => {
          const aIsDir = items[a].type === "dir";
          const bIsDir = items[b].type === "dir";
          if (aIsDir !== bIsDir) {
            return aIsDir ? -1 : 1; // Directories first
          }
          return a.localeCompare(b);
        });

        sortedKeys.forEach((key) => {
          const item = items[key];
          const icon = item.type === "dir" ? "📁" : "📄";
          const fileType = item.type === "file" ? getFileType(key) : "";

          // For files, use the clickable content pattern that matches the original format
          if (item.type === "file") {
            const fullPath = context.repositoryItems.find(
              (repoItem) => repoItem.name === key && repoItem.type === "file"
            )?.path;

            if (fullPath) {
              // Use the original clickable pattern that renderClickableContent expects
              // The pattern should match: "  📄 filename.ext" (no file type suffix)
              context.logger.addLog("info", `${indent}${icon} ${key}`);
            } else {
              context.logger.addLog(
                "info",
                `${indent}${icon} ${key}${fileType}`
              );
            }
          } else {
            context.logger.addLog("info", `${indent}${icon} ${key}${fileType}`);
          }

          if (item.children) {
            renderTree(item.children, `${indent}  `, false);
          }
        });
      };

      // Helper function to determine file type
      const getFileType = (filename: string) => {
        const ext = filename.split(".").pop()?.toLowerCase();
        switch (ext) {
          case "journal":
            return " (ledger)";
          case "json":
            return " (config)";
          case "md":
            return " (readme)";
          case "txt":
            return " (text)";
          default:
            return "";
        }
      };

      context.logger.addLog("info", "  📂 Root:");
      renderTree(tree);

      // Add summary
      const fileCount = context.repositoryItems.filter(
        (item) => item.type === "file"
      ).length;
      const dirCount = context.repositoryItems.filter(
        (item) => item.type === "dir"
      ).length;
      context.logger.addLog("info", "");
      context.logger.addLog(
        "success",
        `📊 Summary: ${fileCount} files, ${dirCount} directories`
      );
    }

    context.updateMessage(
      `Found ${context.repositoryItems.length} items`,
      "info"
    );

    return {
      success: true,
      message: `Found ${context.repositoryItems.length} items`,
    };
  },
};
