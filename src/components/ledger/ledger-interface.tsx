"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLayout } from "@/contexts/layout-context";
import { useFileOperations } from "@/hooks/use-file-operations";
import { useCommandSystem } from "@/hooks/use-command-system";
import { useVimMode } from "@/hooks/use-vim-mode";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { CommandContext, LogMessage } from "@/lib/commands/types";
import {
  saveLastLoadedFile,
  getLastLoadedFile,
  clearLastLoadedFile,
} from "@/lib/storage";
import { findLatestJournalFile } from "@/lib/journal-utils";

// Import extracted components
import { EditorPanel } from "./editor-panel";
import { TerminalPanel } from "./terminal-panel";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GripVertical, EyeOff } from "lucide-react";
import { AnimatedLoadingMessage } from "@/components/ui/loading-dots";

// interface LedgerEntry {
//   date: string;
//   description: string;
//   accounts: Array<{
//     name: string;
//     amount: string;
//   }>;
// }

export default function LedgerInterface() {
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [ledgerContent, setLedgerContent] = useState("");
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);

  const [fileName] = useState("main.ledger");
  const [isModified, setIsModified] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isEditorLoading, setIsEditorLoading] = useState(true);

  // File operations state
  const [repository, setRepository] = useState<{
    owner: string;
    repo: string;
  } | null>(null);
  const [repositoryItems, setRepositoryItems] = useState<
    Array<{ name: string; path: string; type: string }>
  >([]);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  // Loading states
  const [, setIsConnectingToRepo] = useState(false);
  const [, setIsLoadingFiles] = useState(false);

  // File operations hook
  const { currentFile, loadFile, saveFile } = useFileOperations({
    owner: repository?.owner || "",
    repo: repository?.repo || "",
  });

  // Layout settings
  const { showTerminal, showEditor, splitterRatio, updateSettings, isLoaded } =
    useLayout();

  // Message area state
  const [message, setMessage] = useState(
    "Type 'help' to see available commands"
  );
  const [messageType, setMessageType] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  // Confirmation prompt state
  const [confirmationPrompt, setConfirmationPrompt] = useState<{
    message: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const commandInputRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // Set up global refs for hooks to access
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).currentEditorRef = editorRef;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).currentTerminalInputRef = commandInputRef;
  }, []);

  // Custom hooks
  const { vimModeEnabled, vimModeRef, toggleVimMode, cleanupVimMode } =
    useVimMode();
  const { lastFocusedRef } = useKeyboardShortcuts();

  // Timeout tracking for clearing pending async operations
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Track if initialization log has been added
  const initializationLoggedRef = useRef(false);

  // Track if repository has been loaded
  const repositoryLoadedRef = useRef(false);

  // Track if files have been loaded for current repository
  const filesLoadedRef = useRef<string | null>(null);

  // Track if rules have been loaded for current repository
  const rulesLoadedRef = useRef<string | null>(null);

  // Track if we've attempted to load the default file
  const defaultFileLoadedRef = useRef(false);

  // Add log function (defined early so it can be used in useEffect)
  const addLog = useCallback((type: LogMessage["type"], message: string) => {
    const newLog: LogMessage = {
      id:
        typeof window !== "undefined"
          ? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          : "",
      type,
      message,
      timestamp: typeof window !== "undefined" ? new Date() : new Date(0), // Use epoch for SSR
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  // Add timeout to tracking
  const addTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    timeoutsRef.current.add(timeoutId);
  }, []);

  // Clear all tracked timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutsRef.current.clear();
  }, []);

  // Refs for functions to avoid dependency issues
  const addLogRef = useRef(addLog);
  const addTimeoutRef = useRef(addTimeout);

  // Update refs when functions change
  useEffect(() => {
    addLogRef.current = addLog;
    addTimeoutRef.current = addTimeout;
  }, [addLog, addTimeout]);

  // Function to load the default file (latest journal or sample content)
  const loadDefaultFile = useCallback(async () => {
    if (defaultFileLoadedRef.current) return;
    defaultFileLoadedRef.current = true;

    // First, try to load the last loaded file from localStorage
    const lastLoadedFile = getLastLoadedFile();
    if (lastLoadedFile && repository) {
      try {
        addLog("info", `Restoring last loaded file: ${lastLoadedFile.name}`);
        await loadFile(lastLoadedFile.path);
        setCurrentFilePath(lastLoadedFile.path);
        return;
      } catch {
        addLog(
          "warning",
          "Failed to restore last loaded file, trying latest journal..."
        );
        clearLastLoadedFile();
      }
    }

    // If no last loaded file or it failed, try to load the latest journal
    if (repository && repositoryItems.length > 0) {
      const latestJournalPath = findLatestJournalFile(repositoryItems);
      if (latestJournalPath) {
        try {
          addLog("info", "Loading latest journal file...");
          await loadFile(latestJournalPath);
          setCurrentFilePath(latestJournalPath);

          // Save to localStorage
          const fileName =
            latestJournalPath.split("/").pop() || "latest.journal";
          saveLastLoadedFile({
            path: latestJournalPath,
            name: fileName,
            timestamp: Date.now(),
          });
          return;
        } catch {
          addLog(
            "warning",
            "Failed to load latest journal, using sample content..."
          );
        }
      }
    }

    // Fallback to sample content if no journal files are available
    const sampleContent = `; Sample Ledger File
; This is a comment

2024/01/15 * Grocery Store
    Expenses:Food:Groceries     $45.67
    Assets:Checking

2024/01/16 * Salary
    Assets:Checking            $3000.00
    Income:Salary

2024/01/17 * Rent Payment
    Expenses:Housing:Rent       $1200.00
    Assets:Checking

2024/01/18 * Coffee Shop
    Expenses:Food:Dining        $12.50
    Assets:Checking`;

    setLedgerContent(sampleContent);
    addLog(
      "info",
      "Loaded sample ledger content. Use 'load -j latest' to load your latest journal."
    );
  }, [repository, repositoryItems, loadFile, addLog]);

  const updateMessage = useCallback(
    (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
      setMessage(text);
      setMessageType(type);
    },
    []
  );

  // Format log message function
  const formatLogMessage = useCallback(
    (log: LogMessage) => {
      const timestamp = log.timestamp.toLocaleTimeString();
      const typeColors = {
        info: "text-blue-400",
        success: "text-green-400",
        error: "text-red-400",
        warning: "text-yellow-400",
        loading: "text-muted-foreground",
      };

      // For loading messages, render with animated dots
      if (log.type === "loading") {
        return (
          <div key={log.id} className="text-sm font-mono whitespace-pre">
            <AnimatedLoadingMessage
              message={log.message}
              className="text-sm font-mono"
              dotColor="muted"
              dotSize="sm"
            />
          </div>
        );
      }

      // Function to render clickable file paths
      const renderClickableContent = (message: string) => {
        // Pattern to match file paths in the tree structure
        // Matches: "  📄 filename.ext" or "    📄 filename.ext" etc.
        const filePattern = /^(\s*)(📄\s+)([^\s]+)$/;
        const match = message.match(filePattern);

        if (match) {
          const [, indent, icon, fileName] = match;
          return (
            <>
              <span className="text-gray-500 text-xs">{timestamp} </span>
              <span className={typeColors[log.type]}>
                {indent}
                {icon}
                <span
                  className="text-blue-400 hover:text-blue-300 cursor-pointer underline hover:no-underline transition-colors"
                  onClick={async () => {
                    // Extract the full path from the repository items
                    const fullPath = repositoryItems.find(
                      (item) => item.name === fileName && item.type === "file"
                    )?.path;

                    if (fullPath) {
                      // Add loading message
                      addLog(
                        "loading",
                        `📄 Loading file from repository: ${fullPath}`
                      );

                      // Add intermediate progress message with ID
                      const progressTimeout = setTimeout(() => {
                        addLog(
                          "info",
                          `   → Fetching file content from GitHub API...`
                        );
                      }, 200);

                      try {
                        await loadFile(fullPath);

                        addLog("loading", "   → Applying content to editor");

                        // Simulate editor loading time
                        await new Promise((resolve) =>
                          setTimeout(resolve, 300)
                        );

                        // Clear the progress timeout
                        clearTimeout(progressTimeout);

                        // Remove all loading messages for this specific file load
                        setLogs((prev) =>
                          prev.filter(
                            (log) =>
                              !log.message.includes(
                                `Loading file from repository: ${fullPath}`
                              ) &&
                              !log.message.includes(
                                "Fetching file content from GitHub API"
                              ) &&
                              !log.message.includes(
                                "Applying content to editor"
                              )
                          )
                        );
                        setCurrentFilePath(fullPath);

                        // Save to localStorage
                        saveLastLoadedFile({
                          path: fullPath,
                          name: fileName,
                          timestamp: Date.now(),
                        });

                        addLog("success", `Loaded file: ${fullPath}`);
                        updateMessage(`Loaded file: ${fullPath}`, "success");
                      } catch (error) {
                        // Clear the progress timeout
                        clearTimeout(progressTimeout);

                        // Remove all loading messages for this specific file load
                        setLogs((prev) =>
                          prev.filter(
                            (log) =>
                              !log.message.includes(
                                `Loading file from repository: ${fullPath}`
                              ) &&
                              !log.message.includes(
                                "Fetching file content from GitHub API"
                              ) &&
                              !log.message.includes(
                                "Applying content to editor"
                              )
                          )
                        );
                        const errorMessage =
                          error instanceof Error
                            ? error.message
                            : "Failed to load file";
                        addLog("error", `Failed to load file: ${errorMessage}`);
                        updateMessage("Failed to load file", "error");
                      }
                    }
                  }}
                  title={`Click to load ${fileName}`}
                >
                  {fileName}
                </span>
              </span>
            </>
          );
        }

        // For non-file messages, render normally
        return (
          <>
            <span className="text-gray-500 text-xs">{timestamp} </span>
            <span className={typeColors[log.type]}>{message}</span>
          </>
        );
      };

      return (
        <div key={log.id} className="text-sm font-mono whitespace-pre">
          {renderClickableContent(log.message)}
        </div>
      );
    },
    [
      repositoryItems,
      loadFile,
      setCurrentFilePath,
      addLog,
      updateMessage,
      setLogs,
    ]
  );

  // Add initial log message on client side only (run once on mount)
  useEffect(() => {
    if (!initializationLoggedRef.current) {
      addLog("info", "Ledger CLI Interface initialized");
      initializationLoggedRef.current = true;
    }

    // Immediately clean up any persistent loading messages
    setLogs((prev) =>
      prev.filter(
        (log) =>
          !(
            log.type === "loading" &&
            log.message.includes("Loading rules and accounts")
          )
      )
    );
  }, [addLog]);

  // Cleanup any persistent loading messages
  useEffect(() => {
    const cleanupLoadingMessages = () => {
      setLogs((prev) => {
        const filtered = prev.filter(
          (log) =>
            !(
              log.type === "loading" &&
              log.message.includes("Loading rules and accounts")
            )
        );
        if (filtered.length !== prev.length) {
          console.log("🧹 Cleaned up persistent loading messages");
        }
        return filtered;
      });
    };

    // Clean up loading messages immediately and then every 2 seconds
    cleanupLoadingMessages();
    const interval = setInterval(cleanupLoadingMessages, 2000);

    return () => clearInterval(interval);
  }, []);

  // Clean up loading messages when repository changes
  useEffect(() => {
    if (repository) {
      // Clean up any existing loading messages when repository is set
      setLogs((prev) =>
        prev.filter(
          (log) =>
            !(
              log.type === "loading" &&
              log.message.includes("Loading rules and accounts")
            )
        )
      );
    }
  }, [repository]);

  // Load connected repository
  useEffect(() => {
    const loadRepository = async () => {
      if (repositoryLoadedRef.current) return;

      setIsConnectingToRepo(true);
      repositoryLoadedRef.current = true;

      // Add loading message with specific ID
      const loadingLogId = Date.now().toString();
      const loadingLog: LogMessage = {
        id: loadingLogId,
        type: "loading",
        message: "🔗 Connecting to GitHub repository",
        timestamp: new Date(),
      };
      setLogs((prev) => [...prev, loadingLog]);

      try {
        const response = await fetch("/api/ledger/repos");

        if (response.ok) {
          const data = await response.json();
          if (data.connectedRepo) {
            setRepository({
              owner: data.connectedRepo.repo_owner,
              repo: data.connectedRepo.repo_name,
            });

            // Remove loading message and add success
            setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
            addLogRef.current(
              "success",
              `Connected to repository: ${data.connectedRepo.repo_full_name}`
            );
          } else {
            // Remove loading message and add warning
            setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
            addLogRef.current(
              "warning",
              "No repository connected. Use 'files' to see available files."
            );
          }
        }
      } catch {
        // Remove loading message and add error
        setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
        addLogRef.current("error", "Failed to load repository information");
      } finally {
        setIsConnectingToRepo(false);
      }
    };

    loadRepository();
  }, []); // Empty dependency array to run only once

  // Function to refresh repository items
  const refreshRepositoryItems = useCallback(async () => {
    if (!repository) return;

    try {
      const response = await fetch(
        `/api/github/files?owner=${repository.owner}&repo=${repository.repo}`
      );

      if (response.ok) {
        const data = await response.json();
        const items = data.files || [];
        setRepositoryItems(items);
      }
    } catch (error) {
      console.error("Failed to refresh repository items:", error);
    }
  }, [repository]);

  // Function to request user confirmation
  const requestConfirmation = useCallback(
    async (message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmationPrompt({ message, resolve });
      });
    },
    []
  );

  // Load rules when repository is connected
  useEffect(() => {
    // console.log("🔍 Rules useEffect triggered, repository:", repository);
    // console.log(
    //   "🔍 Repository owner:",
    //   repository?.owner,
    //   "repo:",
    //   repository?.repo
    // );
    const loadRules = async () => {
      if (!repository) {
        // console.log("🔍 No repository, returning");
        return;
      }

      const repoKey = `${repository.owner}/${repository.repo}`;
      // console.log(
      //   "🔍 Checking if rules already loaded for:",
      //   repoKey,
      //   "Current:",
      //   rulesLoadedRef.current
      // );
      if (rulesLoadedRef.current === repoKey) {
        // console.log("🔍 Rules already loaded, skipping");
        return;
      }

      // console.log("🔍 Setting rules loaded ref to:", repoKey);
      rulesLoadedRef.current = repoKey;

      // Add loading message with specific ID
      const loadingLogId = Date.now().toString();
      const loadingLog: LogMessage = {
        id: loadingLogId,
        type: "loading",
        message: "📋 Loading rules and accounts from repository",
        timestamp: new Date(),
      };
      // console.log("🔍 Adding loading message with ID:", loadingLogId);
      setLogs((prev) => {
        // console.log("🔍 Current logs before adding loading:", prev.length);
        // Check if there are already loading messages
        const existingLoadingLogs = prev.filter(
          (log) =>
            log.type === "loading" &&
            log.message.includes("Loading rules and accounts")
        );
        // console.log("🔍 Existing loading logs:", existingLoadingLogs.length);
        if (existingLoadingLogs.length > 0) {
          // console.log(
          //   "🔍 WARNING: Found existing loading logs, removing them first"
          // );
          const filtered = prev.filter(
            (log) =>
              !(
                log.type === "loading" &&
                log.message.includes("Loading rules and accounts")
              )
          );
          const newLogs = [...filtered, loadingLog];
          // console.log(
          //   "🔍 New logs after removing existing and adding new loading:",
          //   newLogs.length
          // );
          return newLogs;
        }
        const newLogs = [...prev, loadingLog];
        // console.log("🔍 New logs after adding loading:", newLogs.length);
        return newLogs;
      });

      try {
        // Import the rules engine
        const { loadRules: loadRulesFromEngine } = await import(
          "@/lib/commands/natural-language/rules-engine"
        );

        const { rules, accounts } = await loadRulesFromEngine({
          owner: repository.owner,
          repo: repository.repo,
        });

        // Remove loading message and add success
        // console.log("🔍 Removing loading message with ID:", loadingLogId);
        setLogs((prev) => {
          const filtered = prev.filter((log) => log.id !== loadingLogId);
          // console.log(
          //   "🔍 Filtered logs count:",
          //   filtered.length,
          //   "Original count:",
          //   prev.length
          // );
          // Add success message directly to the filtered logs
          const successLog: LogMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "success",
            message: `Loaded ${rules.items.length} item rules, ${rules.merchants.length} merchant rules, ${rules.payments.length} payment rules, ${accounts.length} accounts`,
            timestamp: new Date(),
          };
          return [...filtered, successLog];
        });
      } catch (error) {
        // Remove loading message and add error
        setLogs((prev) => {
          const filtered = prev.filter((log) => log.id !== loadingLogId);
          // Add error message directly to the filtered logs
          const errorLog: LogMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "warning",
            message: `Failed to load rules: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            timestamp: new Date(),
          };
          return [...filtered, errorLog];
        });
      }
    };

    loadRules();
  }, [repository]); // Only depend on repository

  // Load available files when repository is connected
  useEffect(() => {
    const loadFiles = async () => {
      if (!repository) return;

      const repoKey = `${repository.owner}/${repository.repo}`;
      if (filesLoadedRef.current === repoKey) return;

      setIsLoadingFiles(true);
      filesLoadedRef.current = repoKey;

      // Add loading message with specific ID
      const loadingLogId = Date.now().toString();
      const loadingLog: LogMessage = {
        id: loadingLogId,
        type: "loading",
        message: "📁 Scanning repository structure and loading files",
        timestamp: new Date(),
      };
      setLogs((prev) => [...prev, loadingLog]);

      try {
        const response = await fetch(
          `/api/github/files?owner=${repository.owner}&repo=${repository.repo}`
        );

        if (response.ok) {
          const data = await response.json();
          const items = data.files || [];
          setRepositoryItems(items);
          const fileCount = items.filter(
            (item: { type: string }) => item.type === "file"
          ).length;

          // Remove loading message and add success
          setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
          addLogRef.current("info", `Found ${fileCount} files in repository`);
        }
      } catch {
        // Remove loading message and add error
        setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
        addLogRef.current("error", "Failed to load repository files");
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFiles();
  }, [repository]); // Only depend on repository, not addLog

  // Load default file when repository and files are available
  useEffect(() => {
    if (repository && repositoryItems.length > 0) {
      loadDefaultFile();
    }
  }, [repository, repositoryItems, loadDefaultFile]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Focus input on mount and after command execution
  useEffect(() => {
    if (commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, []);

  // Sync editor content with loaded file
  useEffect(() => {
    if (currentFile) {
      setLedgerContent(currentFile.content);
      setIsModified(false);
    }
  }, [currentFile]);

  // Mobile detection removed - handled by LayoutToggles component

  // Cleanup Vim mode on unmount
  useEffect(() => {
    return () => {
      cleanupVimMode();
    };
  }, [cleanupVimMode]);

  // Handle keyboard shortcuts for confirmation prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!confirmationPrompt) return;

      if (e.key.toLowerCase() === "y" || e.key === "Enter") {
        confirmationPrompt.resolve(true);
        setConfirmationPrompt(null);
        e.preventDefault();
      } else if (e.key.toLowerCase() === "n" || e.key === "Escape") {
        confirmationPrompt.resolve(false);
        setConfirmationPrompt(null);
        e.preventDefault();
      }
    };

    if (confirmationPrompt) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [confirmationPrompt]);

  // Enhanced setCommand that also handles auto-resize and focus
  const setCommandWithResize = useCallback((newCommand: string) => {
    setCommand(newCommand);
    // Focus the textarea after setting the command
    setTimeout(() => {
      if (commandInputRef.current) {
        commandInputRef.current.focus();
      }
    }, 0);
  }, []);

  // Auto-resize textarea when command changes
  useEffect(() => {
    if (commandInputRef.current) {
      const textarea = commandInputRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [command]);

  // Create command context for the command system
  const commandContext: CommandContext = useMemo(
    () => ({
      repository,
      fileOperations: {
        loadFile,
        saveFile,
        updateContent: setLedgerContent,
        clearFile: () => {
          setLedgerContent("");
          setIsModified(false);
        },
        currentFile,
        loading: false,
        error: null,
        isModified,
      },
      logger: {
        addLog,
        setLogs,
        logs,
        addTimeout,
        clearAllTimeouts,
      },
      editor: {
        setLedgerContent,
        setIsModified,
        ledgerContent,
        isModified,
      },
      settings: {
        showTerminal,
        showEditor,
        vimModeEnabled,
        splitterRatio,
      },
      repositoryItems,
      setCurrentFilePath,
      updateMessage,
      setCommand: setCommandWithResize,
      refreshRepositoryItems,
      requestConfirmation,
    }),
    [
      repository,
      loadFile,
      saveFile,
      currentFile,
      isModified,
      addLog,
      setLogs,
      logs,
      addTimeout,
      clearAllTimeouts,
      setLedgerContent,
      setIsModified,
      ledgerContent,
      showTerminal,
      showEditor,
      vimModeEnabled,
      splitterRatio,
      repositoryItems,
      setCurrentFilePath,
      updateMessage,
      setCommandWithResize,
      refreshRepositoryItems,
      requestConfirmation,
    ]
  );

  // Use the new command system
  const { executeCommand: executeCommandNew } = useCommandSystem({
    context: commandContext,
  });

  const executeCommand = useCallback(
    async (cmd: string) => {
      if (!cmd.trim() || isExecutingCommand) return;

      // Set loading state
      setIsExecutingCommand(true);

      try {
        // Add to history
        setCommandHistory((prev) => [...prev, cmd]);
        setHistoryIndex(-1);

        // Check if this is an add command that should populate the input
        const isAddCommand = cmd.trim().toLowerCase().startsWith("add ");

        // Execute using new command system
        await executeCommandNew(cmd);

        // Only clear the command if it's not an add command
        if (!isAddCommand) {
          setCommand("");
          if (commandInputRef.current) {
            commandInputRef.current.style.height = "auto";
            commandInputRef.current.focus();
          }
        }
      } finally {
        // Always clear loading state
        setIsExecutingCommand(false);
      }
    },
    [executeCommandNew, isExecutingCommand]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand(command);
    } else if (e.key === "ArrowUp" && !e.shiftKey) {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown" && !e.shiftKey) {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommand(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Don't render until settings are loaded to prevent flickering
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {showTerminal && showEditor ? (
          // Both panels visible - use resizable panels
          <PanelGroup
            direction="horizontal"
            className="h-full"
            onLayout={(sizes) => {
              // Save the splitter ratio when user drags it
              if (sizes.length >= 2) {
                const newRatio = sizes[0] / 100; // Convert percentage to ratio (0.0 to 1.0)
                updateSettings({ splitterRatio: newRatio });
              }
            }}
          >
            {/* Left Panel - Terminal */}
            <Panel defaultSize={splitterRatio * 100} minSize={25} maxSize={75}>
              <TerminalPanel
                logs={logs}
                command={command}
                commandHistory={commandHistory}
                commandInputRef={commandInputRef}
                logsEndRef={logsEndRef}
                handleCommandChange={handleCommandChange}
                handleKeyDown={handleKeyDown}
                setLogs={setLogs}
                formatLogMessage={formatLogMessage}
                message={message}
                messageType={messageType}
                isExecutingCommand={isExecutingCommand}
              />
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors relative group">
              <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-border group-hover:bg-accent transition-colors" />
              <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-6">
                <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </PanelResizeHandle>

            {/* Right Panel - Editor */}
            <Panel
              defaultSize={(1 - splitterRatio) * 100}
              minSize={25}
              maxSize={75}
            >
              <EditorPanel
                fileName={currentFilePath || fileName}
                isModified={isModified}
                ledgerContent={ledgerContent}
                cursorPosition={cursorPosition}
                editorRef={editorRef}
                setLedgerContent={setLedgerContent}
                setIsModified={setIsModified}
                setCursorPosition={setCursorPosition}
                isEditorLoading={isEditorLoading}
                setIsEditorLoading={setIsEditorLoading}
                vimModeRef={vimModeRef}
                vimModeEnabled={vimModeEnabled}
                toggleVimMode={toggleVimMode}
                onEditorFocused={() => {
                  lastFocusedRef.current = "editor";
                }}
                saveFile={saveFile}
                addLog={addLog}
                setLogs={setLogs}
                updateMessage={updateMessage}
              />
            </Panel>
          </PanelGroup>
        ) : showTerminal ? (
          // Only terminal visible
          <div className="h-full">
            <TerminalPanel
              logs={logs}
              command={command}
              commandHistory={commandHistory}
              commandInputRef={commandInputRef}
              logsEndRef={logsEndRef}
              handleCommandChange={handleCommandChange}
              handleKeyDown={handleKeyDown}
              setLogs={setLogs}
              formatLogMessage={formatLogMessage}
              message={message}
              messageType={messageType}
              isExecutingCommand={isExecutingCommand}
            />
          </div>
        ) : showEditor ? (
          // Only editor visible
          <div className="h-full">
            <EditorPanel
              fileName={currentFilePath || fileName}
              isModified={isModified}
              ledgerContent={ledgerContent}
              cursorPosition={cursorPosition}
              editorRef={editorRef}
              setLedgerContent={setLedgerContent}
              setIsModified={setIsModified}
              setCursorPosition={setCursorPosition}
              isEditorLoading={isEditorLoading}
              setIsEditorLoading={setIsEditorLoading}
              vimModeRef={vimModeRef}
              vimModeEnabled={vimModeEnabled}
              toggleVimMode={toggleVimMode}
              onEditorFocused={() => {
                lastFocusedRef.current = "editor";
              }}
              saveFile={saveFile}
              addLog={addLog}
              setLogs={setLogs}
              updateMessage={updateMessage}
            />
          </div>
        ) : (
          // No panels visible - show message
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <EyeOff className="w-12 h-12 mx-auto mb-4" />
              <p>
                No panels visible. Use the toggle buttons above to show panels.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Prompt Modal */}
      {confirmationPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirmation Required
            </h3>
            <p className="text-muted-foreground mb-6">
              {confirmationPrompt.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  confirmationPrompt.resolve(false);
                  setConfirmationPrompt(null);
                }}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent"
              >
                Cancel (n)
              </button>
              <button
                onClick={() => {
                  confirmationPrompt.resolve(true);
                  setConfirmationPrompt(null);
                }}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Continue (y)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
