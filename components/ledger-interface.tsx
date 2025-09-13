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

  const addLog = (type: LogMessage["type"], message: string) => {
    const newLog: LogMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, newLog]);
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
        break;

      case "accounts":
        addLog("success", "Available Accounts:");
        addLog("info", "  Assets:Checking");
        addLog("info", "  Expenses:Food:Groceries");
        addLog("info", "  Expenses:Food:Dining");
        addLog("info", "  Expenses:Housing:Rent");
        addLog("info", "  Income:Salary");
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
        } else {
          addLog("warning", "Usage: add transaction");
        }
        break;

      case "save":
        addLog("success", `File saved: ${fileName}`);
        setIsModified(false);
        break;

      case "validate":
        addLog("info", "Validating ledger entries...");
        setTimeout(() => {
          addLog("success", "All entries are valid");
        }, 500);
        break;

      case "clear":
        setLogs([]);
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
        break;

      default:
        addLog(
          "error",
          `Unknown command: ${mainCommand}. Type 'help' for available commands.`
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
    <div className="h-screen bg-background">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Terminal */}
        <Panel defaultSize={40} minSize={25} maxSize={75}>
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
          </div>
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
        </Panel>
      </PanelGroup>
    </div>
  );
}
