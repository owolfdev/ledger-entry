import type {
  Command,
  CommandContext,
  CommandResult,
  CommandRegistry,
} from "./types";

export class CommandRegistryImpl implements CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        this.commands.set(alias, command);
      });
    }
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAll(): Command[] {
    const uniqueCommands = new Set<Command>();
    this.commands.forEach((command) => uniqueCommands.add(command));
    return Array.from(uniqueCommands);
  }

  findByNameOrAlias(name: string): Command | undefined {
    return this.commands.get(name);
  }

  async execute(
    commandName: string,
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> {
    const command = this.findByNameOrAlias(commandName);

    if (!command) {
      return {
        success: false,
        message: `Unknown command: ${commandName}. Type 'help' for available commands.`,
        logs: [
          {
            id: Date.now().toString(),
            type: "error",
            message: `Unknown command: ${commandName}. Type 'help' for available commands.`,
            timestamp: new Date(),
          },
        ],
      };
    }

    // Validate arguments if validator exists
    if (command.validate) {
      const validation = command.validate(args);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || "Invalid command arguments",
          logs: [
            {
              id: Date.now().toString(),
              type: "error",
              message: validation.error || "Invalid command arguments",
              timestamp: new Date(),
            },
          ],
        };
      }
    }

    try {
      const result = await command.execute(args, context);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Command execution failed";
      return {
        success: false,
        message: errorMessage,
        logs: [
          {
            id: Date.now().toString(),
            type: "error",
            message: errorMessage,
            timestamp: new Date(),
          },
        ],
      };
    }
  }
}

// Create and export a singleton instance
export const commandRegistry = new CommandRegistryImpl();
