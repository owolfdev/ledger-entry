"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Save,
  FileText,
  Terminal,
  Play,
  CableCar as Clear,
  History,
  GripVertical,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
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
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: "1",
      type: "info",
      message: "Ledger CLI Interface initialized",
      timestamp: new Date(),
    },
  ]);
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

  // Panel visibility state
  const [showTerminal, setShowTerminal] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Message area state
  const [message, setMessage] = useState(
    "Type 'help' to see available commands"
  );
  const [messageType, setMessageType] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  const commandInputRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

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
      if (window.innerWidth < 768) {
        // On mobile, start with terminal only
        setShowTerminal(true);
        setShowEditor(false);
      } else {
        // On desktop, start with terminal only (cycling system)
        setShowTerminal(true);
        setShowEditor(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Panel toggle functions
  const toggleTerminal = () => {
    if (isMobile) {
      // Mobile: simple toggle between terminal and editor
      setShowTerminal(true);
      setShowEditor(false);
    } else {
      // Desktop: individual toggle
      setShowTerminal(!showTerminal);
    }
  };

  const toggleEditor = () => {
    if (isMobile) {
      // Mobile: simple toggle between terminal and editor
      setShowTerminal(false);
      setShowEditor(true);
    } else {
      // Desktop: individual toggle
      setShowEditor(!showEditor);
    }
  };

  const toggleBoth = () => {
    if (isMobile) {
      // Mobile: simple toggle between terminal and editor
      if (showTerminal) {
        setShowTerminal(false);
        setShowEditor(true);
      } else {
        setShowTerminal(true);
        setShowEditor(false);
      }
    } else {
      // Desktop: cycle through: terminal only -> editor only -> both -> terminal only
      if (showTerminal && !showEditor) {
        // Currently showing terminal only, switch to editor only
        setShowTerminal(false);
        setShowEditor(true);
      } else if (!showTerminal && showEditor) {
        // Currently showing editor only, switch to both
        setShowTerminal(true);
        setShowEditor(true);
      } else if (showTerminal && showEditor) {
        // Currently showing both, switch to terminal only
        setShowTerminal(true);
        setShowEditor(false);
      }
    }
  };

  const addLog = (type: LogMessage["type"], message: string) => {
    const newLog: LogMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, newLog]);
  };

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
          const template = `\n\n${new Date()
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "/")} * Description
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

  const highlightSyntax = (text: string) => {
    return text.split("\n").map((line, index) => {
      let highlightedLine = line;

      // Date highlighting
      highlightedLine = highlightedLine.replace(
        /(\d{4}\/\d{2}\/\d{2})/g,
        '<span class="syntax-date">$1</span>'
      );

      // Account names
      highlightedLine = highlightedLine.replace(
        /^(\s+)([A-Za-z][A-Za-z0-9:]+)/gm,
        '$1<span class="syntax-account">$2</span>'
      );

      // Amounts
      highlightedLine = highlightedLine.replace(
        /\$[\d,]+\.\d{2}/g,
        '<span class="syntax-amount-positive">$&</span>'
      );

      // Comments
      highlightedLine = highlightedLine.replace(
        /^(\s*);(.*)$/gm,
        '<span class="syntax-comment">$&</span>'
      );

      return (
        <div key={index} className="flex">
          <span className="text-gray-400 text-xs w-8 text-right mr-3 select-none">
            {index + 1}
          </span>
          <span
            dangerouslySetInnerHTML={{ __html: highlightedLine || "&nbsp;" }}
          />
        </div>
      );
    });
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Toggle Bar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant={showTerminal ? "default" : "outline"}
            size="sm"
            onClick={toggleTerminal}
            className="flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            Terminal
          </Button>
          <Button
            variant={showEditor ? "default" : "outline"}
            size="sm"
            onClick={toggleEditor}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Editor
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {isMobile ? (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBoth}
              className="flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              {showTerminal ? "Switch to Editor" : "Switch to Terminal"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBoth}
              className="flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              {showTerminal && !showEditor
                ? "Switch to Editor"
                : !showTerminal && showEditor
                ? "Show Both"
                : "Switch to Terminal"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {showTerminal && showEditor ? (
          // Both panels visible - use resizable panels
          <PanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Terminal */}
            <Panel defaultSize={40} minSize={25} maxSize={75}>
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
            <Panel defaultSize={60} minSize={25} maxSize={75}>
              <EditorPanel
                fileName={fileName}
                isModified={isModified}
                ledgerContent={ledgerContent}
                cursorPosition={cursorPosition}
                editorRef={editorRef}
                setLedgerContent={setLedgerContent}
                setIsModified={setIsModified}
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
  commandInputRef: React.RefObject<HTMLTextAreaElement>;
  logsEndRef: React.RefObject<HTMLDivElement>;
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
}: {
  fileName: string;
  isModified: boolean;
  ledgerContent: string;
  cursorPosition: { line: number; column: number };
  editorRef: React.RefObject<HTMLTextAreaElement>;
  setLedgerContent: (content: string) => void;
  setIsModified: (modified: boolean) => void;
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
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={editorRef}
          value={ledgerContent}
          onChange={(e) => {
            setLedgerContent(e.target.value);
            setIsModified(true);
          }}
          className="w-full h-full p-4 font-mono text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0 overflow-y-auto"
          style={{
            lineHeight: "1.5",
            tabSize: 4,
            whiteSpace: "pre",
          }}
        />

        {/* Syntax highlighting overlay */}
        <div className="absolute inset-0 p-4 pointer-events-none font-mono text-sm leading-6 whitespace-pre">
          {/* This would be replaced with a proper syntax highlighter in production */}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground font-mono flex-shrink-0">
        <div className="flex justify-between">
          <span>
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
          <span>{ledgerContent.split("\n").length} lines</span>
        </div>
      </div>
    </div>
  );
}
