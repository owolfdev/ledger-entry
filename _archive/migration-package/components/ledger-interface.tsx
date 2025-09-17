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

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLayout } from "../contexts/layout-context";

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
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Save,
  FileText,
  Terminal,
  Play,
  Trash2 as Clear,
  History,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

interface LogMessage {
  id: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp: Date;
}

interface LedgerEntry {
  date: string;
  description: string;
  accounts: Array<{
    name: string;
    amount: string;
  }>;
}

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

  const [fileName, setFileName] = useState("main.ledger");
  const [isModified, setIsModified] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Layout settings
  const {
    showTerminal,
    showEditor,
    vimModeEnabled,
    terminalSize,
    editorSize,
    splitterRatio,
    updateSettings,
    isLoaded,
  } = useLayout();

  // Message area state
  const [message, setMessage] = useState(
    "Type 'help' to see available commands"
  );
  const [messageType, setMessageType] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  const commandInputRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cleanup Vim mode on unmount
  useEffect(() => {
    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
      }
    };
  }, []);

  // Helper: focus editor and ensure it is visible
  const focusEditor = () => {
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
  };

  // Helper: focus terminal input and ensure it is visible
  const focusTerminal = () => {
    if (!showTerminal) {
      updateSettings({ showTerminal: true });
    }
    setTimeout(() => {
      if (commandInputRef.current) {
        commandInputRef.current.focus();
        lastFocusedRef.current = "terminal";
      }
    }, 0);
  };

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
  }, [showEditor, showTerminal]);

  const updateMessage = (
    text: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const executeCommand = (cmd: string) => {
    if (!cmd.trim()) return;

    // Add to history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    // Parse and execute command
    const parts = cmd.toLowerCase().trim().split(" ");
    const mainCommand = parts[0];

    addLog("info", `> ${cmd}`);

    switch (mainCommand) {
      case "balance":
      case "bal":
        addLog("success", "Account Balances:");
        addLog("info", "  Assets:Checking        $1,832.83");
        addLog("info", "  Expenses:Food:Groceries   $45.67");
        addLog("info", "  Expenses:Food:Dining      $12.50");
        addLog("info", "  Expenses:Housing:Rent  $1,200.00");
        addLog("info", "  Income:Salary         $-3,000.00");
        updateMessage(
          "Account balances displayed. Use 'accounts' to see all account names.",
          "success"
        );
        break;

      case "accounts":
        addLog("success", "Available Accounts:");
        addLog("info", "  Assets:Checking");
        addLog("info", "  Expenses:Food:Groceries");
        addLog("info", "  Expenses:Food:Dining");
        addLog("info", "  Expenses:Housing:Rent");
        addLog("info", "  Income:Salary");
        updateMessage(
          "All accounts listed. Use 'add transaction' to create new entries.",
          "success"
        );
        break;

      case "add":
        if (parts[1] === "transaction") {
          addLog("success", "Transaction template added to editor");
          const template = `\n\n${
            typeof window !== "undefined"
              ? new Date().toISOString().split("T")[0].replace(/-/g, "/")
              : "2024/01/18"
          } * Description
    Account:Name                 $0.00
    Assets:Checking`;
          setLedgerContent((prev) => prev + template);
          setIsModified(true);
          updateMessage(
            "Transaction template added! Switch to editor to fill in details.",
            "success"
          );
        } else {
          addLog("warning", "Usage: add transaction");
          updateMessage("Try: add transaction", "warning");
        }
        break;

      case "save":
        addLog("success", `File saved: ${fileName}`);
        setIsModified(false);
        updateMessage("File saved successfully!", "success");
        break;

      case "validate":
        addLog("info", "Validating ledger entries...");
        updateMessage("Validating entries...", "info");
        setTimeout(() => {
          addLog("success", "All entries are valid");
          updateMessage(
            "All entries are valid! Your ledger is balanced.",
            "success"
          );
        }, 500);
        break;

      case "clear":
        setLogs([]);
        updateMessage(
          "Terminal cleared. Type 'help' for available commands.",
          "info"
        );
        break;

      case "help":
        addLog("info", "Available commands:");
        addLog("info", "  balance, bal - Show account balances");
        addLog("info", "  accounts - List all accounts");
        addLog("info", "  add transaction - Add transaction template");
        addLog("info", "  save - Save current file");
        addLog("info", "  validate - Validate ledger entries");
        addLog("info", "  clear - Clear terminal output");
        addLog("info", "  help - Show this help message");
        updateMessage(
          "Help displayed! Try 'balance' to see account balances.",
          "info"
        );
        break;

      default:
        addLog(
          "error",
          `Unknown command: ${mainCommand}. Type 'help' for available commands.`
        );
        updateMessage(
          `Unknown command: ${mainCommand}. Type 'help' for available commands.`,
          "error"
        );
    }

    setCommand("");
    if (commandInputRef.current) {
      commandInputRef.current.style.height = "auto";
      commandInputRef.current.focus();
    }
  };

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
    };

    return (
      <div key={log.id} className="flex gap-2 text-sm font-mono">
        <span className="text-gray-500 text-xs">{timestamp}</span>
        <span className={typeColors[log.type]}>{log.message}</span>
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
                messageType={messageType}
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
                fileName={fileName}
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
              messageType={messageType}
            />
          </div>
        ) : showEditor ? (
          // Only editor visible
          <div className="h-full">
            <EditorPanel
              fileName={fileName}
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
  messageType,
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
  messageType: "info" | "success" | "warning" | "error";
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
  editorRef: React.RefObject<any>;
  setLedgerContent: (content: string) => void;
  setIsModified: (modified: boolean) => void;
  setCursorPosition: (position: { line: number; column: number }) => void;
  isEditorLoading: boolean;
  setIsEditorLoading: (loading: boolean) => void;
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
