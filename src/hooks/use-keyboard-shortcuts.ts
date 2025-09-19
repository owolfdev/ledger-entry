"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLayout } from "@/contexts/layout-context";

export function useKeyboardShortcuts() {
  const { showTerminal, showEditor, updateSettings } = useLayout();
  const lastFocusedRef = useRef<"editor" | "terminal">("terminal");

  // Helper: focus editor and ensure it is visible
  const focusEditor = useCallback(() => {
    if (!showEditor) {
      updateSettings({ showEditor: true });
    }
    // Give layout a tick to render if it was hidden
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const editorRef = (globalThis as any).currentEditorRef;
      if (editorRef?.current && typeof editorRef.current.focus === "function") {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const terminalInputRef = (globalThis as any).currentTerminalInputRef;
      if (terminalInputRef?.current) {
        terminalInputRef.current.focus();
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

  return {
    focusEditor,
    focusTerminal,
    lastFocusedRef,
  };
}
