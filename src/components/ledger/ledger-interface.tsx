"use client";

/**
 * Monaco Editor + Next.js 15 Integration Notes:
 *
 * 🔧 CRITICAL: Monaco Editor requires browser-only APIs (window, document)
 *
 * ✅ DO:
 * - Use `next/dynamic` with `ssr: false` for Monaco Editor components
 * - Use dynamic imports for monaco-vim: `import("monaco-vim").then(...)`
 * - Initialize Vim mode only after editor mounts (useEffect/onMount)
 *
 * ❌ DON'T:
 * - Import monaco-vim at top level (causes SSR "window is not defined" errors)
 * - Use static imports for browser-only Monaco packages
 * - Initialize Vim mode during component render
 *
 * 📚 Pattern: Browser-only libraries in Next.js 15 App Router need dynamic imports
 * to prevent SSR conflicts. Monaco Editor ecosystem is entirely client-side.
 */

import type React from "react";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLayout } from "@/contexts/layout-context";
import { useFileOperations } from "@/hooks/use-file-operations";
import { useCommandSystem } from "@/hooks/use-command-system";
import type { CommandContext, LogMessage } from "@/lib/commands/types";

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">
          Loading Monaco Editor...
        </span>
      </div>
    </div>
  ),
});
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ledger/ui/scroll-area";
import { AnimatedLoadingMessage } from "@/components/ui/loading-dots";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Save,
  FileText,
  Terminal,
  Play,
  Trash2 as Clear,
  History,
  GripVertical,
  EyeOff,
} from "lucide-react";

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
  const [ledgerContent, setLedgerContent] = useState(`; Sample Ledger File
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
    Assets:Checking`);

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
  const [isConnectingToRepo, setIsConnectingToRepo] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // File operations hook
  const { currentFile, loadFile } = useFileOperations({
    owner: repository?.owner || "",
    repo: repository?.repo || "",
  });

  // Layout settings
  const {
    showTerminal,
    showEditor,
    vimModeEnabled,
    splitterRatio,
    updateSettings,
    isLoaded,
  } = useLayout();

  // Message area state
  const [message, setMessage] = useState(
    "Type 'help' to see available commands"
  );
  const [, setMessageType] = useState<"info" | "success" | "warning" | "error">(
    "info"
  );

  const commandInputRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vimModeRef = useRef<any>(null);
  const lastFocusedRef = useRef<"editor" | "terminal">("terminal");

  // Add log function (defined early so it can be used in useEffect)
  const addLog = (type: LogMessage["type"], message: string) => {
    const newLog: LogMessage = {
      id: typeof window !== "undefined" ? Date.now().toString() : "",
      type,
      message,
      timestamp: typeof window !== "undefined" ? new Date() : new Date(0), // Use epoch for SSR
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Add initial log message on client side only
  useEffect(() => {
    addLog("info", "Ledger CLI Interface initialized");
  }, []);

  // Load connected repository
  useEffect(() => {
    const loadRepository = async () => {
      setIsConnectingToRepo(true);

      // Add loading message
      const loadingLogId = Date.now().toString();
      addLog("loading", "🔗 Connecting to GitHub repository...");

      try {
        // Add intermediate progress message
        setTimeout(() => {
          if (isConnectingToRepo) {
            addLog(
              "info",
              "   → Fetching repository information from database..."
            );
          }
        }, 500);

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
            addLog(
              "success",
              `Connected to repository: ${data.connectedRepo.repo_full_name}`
            );
          } else {
            // Remove loading message and add warning
            setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
            addLog(
              "warning",
              "No repository connected. Use 'files' to see available files."
            );
          }
        }
      } catch {
        // Remove loading message and add error
        setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
        addLog("error", "Failed to load repository information");
      } finally {
        setIsConnectingToRepo(false);
      }
    };

    loadRepository();
  }, []);

  // Load available files when repository is connected
  useEffect(() => {
    const loadFiles = async () => {
      if (!repository) return;

      setIsLoadingFiles(true);

      // Add loading message
      const loadingLogId = Date.now().toString();
      addLog(
        "loading",
        "📁 Scanning repository structure and loading files..."
      );

      try {
        // Add intermediate progress message
        setTimeout(() => {
          if (isLoadingFiles) {
            addLog("info", "   → Querying GitHub API for file tree...");
          }
        }, 300);

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
          addLog("info", `Found ${fileCount} files in repository`);
        }
      } catch {
        // Remove loading message and add error
        setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
        addLog("error", "Failed to load repository files");
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFiles();
  }, [repository]);

  // Toggle Vim mode on/off
  const toggleVimMode = () => {
    console.log("Toggle Vim mode clicked! Current state:", vimModeEnabled);

    if (!editorRef.current) {
      console.log("No editor ref, cannot toggle");
      return;
    }

    if (vimModeEnabled) {
      // Disable Vim mode
      console.log("Disabling Vim mode...");
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
      const vimStatusBar = document.getElementById("vim-status-bar");
      if (vimStatusBar) {
        vimStatusBar.textContent = "";
        vimStatusBar.style.opacity = "0.5";
      }
      updateSettings({ vimModeEnabled: false });
    } else {
      // Enable Vim mode
      console.log("Enabling Vim mode...");
      const vimStatusBar = document.getElementById("vim-status-bar");
      if (vimStatusBar) {
        vimStatusBar.style.opacity = "1";
        vimStatusBar.textContent = "";
      }

      // Initialize Vim mode
      import("monaco-vim")
        .then((vim) => {
          try {
            if (editorRef.current && vimStatusBar) {
              const vimMode = vim.initVimMode(editorRef.current, vimStatusBar);
              vimModeRef.current = vimMode;
              updateSettings({ vimModeEnabled: true });
              console.log("Vim mode enabled successfully");
            }
          } catch (error) {
            console.error("Failed to initialize monaco-vim:", error);
          }
        })
        .catch((error) => {
          console.error("Failed to load monaco-vim:", error);
        });
    }
  };

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
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
      }
    };
  }, []);

  // Helper: focus editor and ensure it is visible
  const focusEditor = useCallback(() => {
    if (!showEditor) {
      updateSettings({ showEditor: true });
    }
    // Give layout a tick to render if it was hidden
    setTimeout(() => {
      if (editorRef.current && typeof editorRef.current.focus === "function") {
        editorRef.current.focus();
        lastFocusedRef.current = "editor";
      }
    }, 0);
  }, [showEditor, updateSettings]);

  // Helper: focus terminal input and ensure it is visible
  const focusTerminal = useCallback(() => {
    if (!showTerminal) {
      updateSettings({ showTerminal: true });
    }
    setTimeout(() => {
      if (commandInputRef.current) {
        commandInputRef.current.focus();
        lastFocusedRef.current = "terminal";
      }
    }, 0);
  }, [showTerminal, updateSettings]);

  // Global keyboard shortcuts for quick panel focus/toggling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || !e.shiftKey) return;

      // Cmd/Ctrl+Shift+E → focus Editor
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        focusEditor();
        return;
      }

      // Cmd/Ctrl+Shift+T → focus Terminal
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        focusTerminal();
        return;
      }

      // Cmd/Ctrl+Shift+` → toggle focus between Editor and Terminal
      if (e.key === "`") {
        e.preventDefault();
        if (lastFocusedRef.current === "editor") {
          focusTerminal();
        } else {
          focusEditor();
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showEditor, showTerminal, focusEditor, focusTerminal]);

  const updateMessage = (
    text: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  // Create command context for the command system
  const commandContext: CommandContext = useMemo(
    () => ({
      repository,
      fileOperations: {
        loadFile,
        saveFile: async (content: string, message?: string) => {
          // This would need to be implemented to actually save files
          console.log("Save file:", content, message);
        },
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
    }),
    [
      repository,
      loadFile,
      currentFile,
      isModified,
      addLog,
      setLogs,
      logs,
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
    ]
  );

  // Use the new command system
  const { executeCommand: executeCommandNew } = useCommandSystem({
    context: commandContext,
  });

  const executeCommand = useCallback(
    async (cmd: string) => {
      if (!cmd.trim()) return;

      // Add to history
      setCommandHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);

      // Execute using new command system
      await executeCommandNew(cmd);

      setCommand("");
      if (commandInputRef.current) {
        commandInputRef.current.style.height = "auto";
        commandInputRef.current.focus();
      }
    },
    [executeCommandNew]
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

  const formatLogMessage = (log: LogMessage) => {
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
                onClick={() => {
                  // Extract the full path from the repository items
                  const fullPath = repositoryItems.find(
                    (item) => item.name === fileName && item.type === "file"
                  )?.path;

                  if (fullPath) {
                    loadFile(fullPath)
                      .then(() => {
                        setCurrentFilePath(fullPath);
                        addLog("success", `Loaded file: ${fullPath}`);
                        updateMessage(`Loaded file: ${fullPath}`, "success");
                      })
                      .catch((error) => {
                        addLog(
                          "error",
                          `Failed to load file: ${error.message}`
                        );
                        updateMessage("Failed to load file", "error");
                      });
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
  };

  // Don't render until settings are loaded to prevent flickering
  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
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
    </div>
  );
}

// Terminal Panel Component
function TerminalPanel({
  logs,
  command,
  commandHistory,
  commandInputRef,
  logsEndRef,
  handleCommandChange,
  handleKeyDown,
  setLogs,
  formatLogMessage,
  message,
}: {
  logs: LogMessage[];
  command: string;
  commandHistory: string[];
  commandInputRef: React.RefObject<HTMLTextAreaElement | null>;
  logsEndRef: React.RefObject<HTMLDivElement | null>;
  handleCommandChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setLogs: (logs: LogMessage[]) => void;
  formatLogMessage: (log: LogMessage) => React.ReactNode;
  message: string;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Status Output Terminal - Top */}
      <div className="flex-1 terminal border-b border-border flex flex-col min-h-0">
        <div className="p-3 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">
              Terminal Output
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogs([])}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <Clear className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              <div className="space-y-1">
                {logs.map(formatLogMessage)}
                <div ref={logsEndRef} />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Command Input Terminal - Bottom */}
      <div className="min-h-20 terminal border-t border-border flex-shrink-0">
        <div className="p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">
              Command Input
            </span>
            {commandHistory.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <History className="w-3 h-3 mr-1" />
                {commandHistory.length}
              </Badge>
            )}
          </div>
          <div className="flex items-start gap-2 font-mono">
            <span className="text-muted-foreground mt-1">$</span>
            <textarea
              ref={commandInputRef}
              value={command}
              onChange={handleCommandChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none font-mono resize-none overflow-hidden min-h-6 px-2 py-1"
              rows={1}
              style={{ lineHeight: "1.5" }}
            />
          </div>
        </div>
      </div>

      {/* Message Area - Bottom */}
      <div className="min-h-12 border-t border-border bg-card flex-shrink-0">
        <div className="p-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}

// Editor Panel Component
function EditorPanel({
  fileName,
  isModified,
  ledgerContent,
  cursorPosition,
  editorRef,
  setLedgerContent,
  setIsModified,
  setCursorPosition,
  isEditorLoading,
  setIsEditorLoading,
  vimModeRef,
  vimModeEnabled,
  toggleVimMode,
  onEditorFocused,
}: {
  fileName: string;
  isModified: boolean;
  ledgerContent: string;
  cursorPosition: { line: number; column: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorRef: React.RefObject<any>;
  setLedgerContent: (content: string) => void;
  setIsModified: (modified: boolean) => void;
  setCursorPosition: (position: { line: number; column: number }) => void;
  isEditorLoading: boolean;
  setIsEditorLoading: (loading: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vimModeRef: React.RefObject<any>;
  vimModeEnabled: boolean;
  toggleVimMode: () => void;
  onEditorFocused: () => void;
}) {
  return (
    <div className="h-full flex flex-col editor">
      {/* Editor Header */}
      <div className="p-3 border-b border-border bg-secondary/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="font-mono text-sm">{fileName}</span>
            {isModified && (
              <Badge variant="outline" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={vimModeEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleVimMode}
              className={
                vimModeEnabled
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                  : ""
              }
            >
              {vimModeEnabled ? "Vim ON" : "Vim OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModified(false)}
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden relative bg-background">
        {isEditorLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading editor...
              </span>
            </div>
          </div>
        )}
        <Editor
          height="100%"
          defaultLanguage="ledger"
          value={ledgerContent}
          onChange={(value) => {
            if (value !== undefined) {
              setLedgerContent(value);
              setIsModified(true);
            }
          }}
          beforeMount={(monaco) => {
            // Set dark theme immediately to prevent flicker
            monaco.editor.setTheme("vs-dark");

            // Define ledger language
            monaco.languages.register({ id: "ledger" });

            // Configure ledger language
            monaco.languages.setMonarchTokensProvider("ledger", {
              tokenizer: {
                root: [
                  // Comments
                  [/^(\s*);.*$/, "comment"],
                  // Dates (YYYY/MM/DD format)
                  [/\d{4}\/\d{2}\/\d{2}/, "keyword"],
                  // Account names (indented with spaces/tabs)
                  [/^(\s+)([A-Za-z][A-Za-z0-9:]*)/, ["", "string"]],
                  // Amounts (starting with $)
                  [/\$[\d,]+\.\d{2}/, "number"],
                  // Whitespace
                  [/\s+/, "white"],
                  // Everything else
                  [/./, "identifier"],
                ],
              },
            });
          }}
          onMount={(editor, monaco) => {
            // Store the editor instance for future use
            editorRef.current = editor;

            // Ensure dark theme is applied
            monaco.editor.setTheme("vs-dark");

            // Set the language to ledger
            monaco.editor.setModelLanguage(editor.getModel()!, "ledger");

            // Initialize Vim mode using monaco-vim (same as working implementation)
            setTimeout(() => {
              if (!vimModeEnabled) return;

              console.log("Initializing monaco-vim...");

              // Create status bar element for Vim mode
              const vimStatusBar = document.getElementById("vim-status-bar");
              if (!vimStatusBar) {
                console.error("Vim status bar element not found!");
                return;
              }

              // Dynamically import monaco-vim to avoid SSR issues
              import("monaco-vim")
                .then((vim) => {
                  try {
                    const vimMode = vim.initVimMode(editor, vimStatusBar);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (vimModeRef as any).current = vimMode;
                    console.log("monaco-vim initialized successfully!");
                  } catch (error) {
                    console.error("Failed to initialize monaco-vim:", error);
                  }
                })
                .catch((error) => {
                  console.error("Failed to load monaco-vim:", error);
                });
            }, 500);

            // Track cursor position changes
            editor.onDidChangeCursorPosition((e) => {
              setCursorPosition({
                line: e.position.lineNumber,
                column: e.position.column,
              });
            });

            // Track focus changes for toggle shortcut
            editor.onDidFocusEditorText?.(() => {
              onEditorFocused();
            });

            // Editor is now loaded
            setIsEditorLoading(false);
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading Monaco Editor...
                </span>
              </div>
            </div>
          }
          options={{
            fontSize: 14,
            fontFamily:
              "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            theme: "vs-dark",
            // Vim-friendly settings
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: "off",
            wordBasedSuggestions: "off",
            parameterHints: { enabled: false },
            hover: { enabled: false },
            contextmenu: false,
            // Performance optimizations
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
            },
            smoothScrolling: true,
            cursorBlinking: "blink",
            cursorSmoothCaretAnimation: "on",
            // Disable features we don't need for ledger files
            folding: false,
            find: { addExtraSpaceOnTop: false },
            links: false,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground font-mono flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>
              Line {cursorPosition.line}, Column {cursorPosition.column}
            </span>
            <div
              id="vim-status-bar"
              className="text-primary font-bold"
              style={{ opacity: vimModeEnabled ? "1" : "0.5" }}
            >
              {/* Content will be managed by monaco-vim */}
            </div>
          </div>
          <span>{ledgerContent.split("\n").length} lines</span>
        </div>
      </div>
    </div>
  );
}
