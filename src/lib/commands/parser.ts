export interface ParsedCommand {
  command: string;
  args: string[];
  original: string;
}

export function parseCommand(input: string): ParsedCommand {
  if (!input.trim()) {
    return {
      command: "",
      args: [],
      original: input,
    };
  }

  const parts = input.trim().split(" ");
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  return {
    command,
    args,
    original: input,
  };
}

export function validateCommandInput(input: string): {
  valid: boolean;
  error?: string;
} {
  if (!input.trim()) {
    return { valid: false, error: "Empty command" };
  }

  if (input.length > 1000) {
    return { valid: false, error: "Command too long" };
  }

  return { valid: true };
}

export function normalizeCommand(input: string): string {
  return input.trim().toLowerCase();
}
