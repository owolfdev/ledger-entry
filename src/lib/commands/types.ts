export interface LogMessage {
  id: string;
  type: "info" | "success" | "error" | "warning" | "loading";
  message: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface RepositoryInfo {
  owner: string;
  repo: string;
}

export interface FileOperations {
  loadFile: (path: string) => Promise<void>;
  saveFile: (content: string, message?: string) => Promise<void>;
  updateContent: (content: string) => void;
  clearFile: () => void;
  currentFile: { content: string; path: string } | null;
  loading: boolean;
  error: string | null;
  isModified: boolean;
}

export interface EditorInterface {
  setLedgerContent: (content: string) => void;
  setIsModified: (modified: boolean) => void;
  ledgerContent: string;
  isModified: boolean;
}

export interface LayoutSettings {
  showTerminal: boolean;
  showEditor: boolean;
  vimModeEnabled: boolean;
  splitterRatio: number;
}

export interface Logger {
  addLog: (type: LogMessage["type"], message: string) => void;
  setLogs: (logs: LogMessage[]) => void;
  logs: LogMessage[];
  clearAllTimeouts: () => void;
  addTimeout: (timeoutId: NodeJS.Timeout) => void;
}

export interface CommandContext {
  repository: RepositoryInfo | null;
  fileOperations: FileOperations;
  logger: Logger;
  editor: EditorInterface;
  settings: LayoutSettings;
  repositoryItems: Array<{ name: string; path: string; type: string }>;
  setCurrentFilePath: (path: string | null) => void;
  updateMessage: (
    text: string,
    type: "info" | "success" | "warning" | "error"
  ) => void;
  setCommand?: (command: string) => void;
  refreshRepositoryItems?: () => Promise<void>;
  requestConfirmation?: (message: string) => Promise<boolean>;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  details?: string;
  data?: unknown;
  logs?: LogMessage[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  examples?: string[];
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>;
  validate?: (args: string[]) => ValidationResult;
}

export interface CommandRegistry {
  register(command: Command): void;
  get(name: string): Command | undefined;
  getAll(): Command[];
  findByNameOrAlias(name: string): Command | undefined;
  execute(
    commandName: string,
    args: string[],
    context: CommandContext
  ): Promise<CommandResult>;
}
