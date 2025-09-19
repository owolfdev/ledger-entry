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

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, FileText } from "lucide-react";
import type { LogMessage } from "@/lib/commands/types";

// Type declaration for Monaco global
declare global {
  interface Window {
    monaco?: {
      editor: {
        setTheme: (theme: string) => void;
      };
    };
  }
}

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

/**
 * Maps next-themes theme values to Monaco Editor theme values
 * Handles the system theme by detecting the actual system preference
 */
function getMonacoTheme(
  theme: string | undefined,
  systemTheme?: string
): string {
  if (theme === "light") {
    return "vs";
  } else if (theme === "dark") {
    return "vs-dark";
  } else if (theme === "system") {
    // Use systemTheme if available, otherwise default to dark
    return systemTheme === "light" ? "vs" : "vs-dark";
  }
  // Default to dark theme for safety
  return "vs-dark";
}

interface EditorPanelProps {
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
  saveFile: (content: string, message?: string) => Promise<void>;
  addLog: (
    type: "info" | "success" | "error" | "warning" | "loading",
    message: string
  ) => void;
  setLogs: (
    logs: LogMessage[] | ((prev: LogMessage[]) => LogMessage[])
  ) => void;
  updateMessage: (
    text: string,
    type: "info" | "success" | "warning" | "error"
  ) => void;
}

export function EditorPanel({
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
  saveFile,
  addLog,
  setLogs,
  updateMessage,
}: EditorPanelProps) {
  // Get current theme from next-themes
  const { theme, systemTheme } = useTheme();

  // Compute Monaco theme safely
  const monacoTheme = useMemo(() => {
    return getMonacoTheme(theme, systemTheme);
  }, [theme, systemTheme]);

  // Handle theme changes after editor mount
  useEffect(() => {
    if (editorRef.current && window.monaco) {
      try {
        window.monaco.editor.setTheme(monacoTheme);
      } catch (error) {
        console.warn("Failed to update Monaco theme:", error);
      }
    }
  }, [monacoTheme, editorRef]);

  // Handle save functionality
  const handleSave = async () => {
    // Add loading message to terminal
    const loadingLogId = Date.now().toString();
    addLog("loading", `💾 Saving file: ${fileName}`);

    // Add intermediate progress message
    setTimeout(() => {
      addLog("info", "   → Uploading changes to GitHub...");
    }, 200);

    try {
      await saveFile(ledgerContent, `Update ${fileName}`);

      // Remove loading message and add success
      setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
      setIsModified(false);
      addLog("success", `File saved: ${fileName}`);
      updateMessage("File saved successfully!", "success");
    } catch (error) {
      // Remove loading message and add error
      setLogs((prev) => prev.filter((log) => log.id !== loadingLogId));
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save file";
      addLog("error", `Failed to save file: ${errorMessage}`);
      updateMessage("Failed to save file", "error");
    }
  };

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
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600 dark:bg-green-700 dark:hover:bg-green-800"
                  : ""
              }
            >
              {vimModeEnabled ? "Vim ON" : "Vim OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!isModified}
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
            // Set theme immediately to prevent flicker
            monaco.editor.setTheme(monacoTheme);

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

            // Ensure correct theme is applied
            monaco.editor.setTheme(monacoTheme);

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
            theme: monacoTheme,
            // Add padding to prevent text from touching the header
            padding: { top: 12, bottom: 12 },
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
