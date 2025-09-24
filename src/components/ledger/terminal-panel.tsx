"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ledger/ui/scroll-area";
import { Terminal, Play, Trash2 as Clear, History } from "lucide-react";
import type { LogMessage } from "@/lib/commands/types";

interface TerminalPanelProps {
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
  isExecutingCommand: boolean;
}

export function TerminalPanel({
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
  isExecutingCommand,
}: TerminalPanelProps) {
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
              placeholder={
                isExecutingCommand ? "Executing command..." : "Enter command..."
              }
              disabled={isExecutingCommand}
              className={`flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none font-mono resize-none overflow-hidden min-h-6 px-2 py-1 ${
                isExecutingCommand ? "opacity-50 cursor-not-allowed" : ""
              }`}
              rows={1}
              style={{ lineHeight: "1.5" }}
            />
          </div>
        </div>
      </div>

      {/* Message Area - Bottom */}
      <div className="min-h-12 border-t border-border bg-card flex-shrink-0">
        <div className="p-2 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              messageType === "success"
                ? "bg-green-500"
                : messageType === "error"
                ? "bg-red-500"
                : messageType === "warning"
                ? "bg-yellow-500"
                : "bg-muted-foreground"
            }`}
          />
          <span
            className={`text-xs font-mono ${
              messageType === "success"
                ? "text-green-400"
                : messageType === "error"
                ? "text-red-400"
                : messageType === "warning"
                ? "text-yellow-400"
                : "text-muted-foreground"
            }`}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
