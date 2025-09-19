"use client";

import { useRef, useCallback } from "react";
import { useLayout } from "@/contexts/layout-context";

export function useVimMode() {
  const { vimModeEnabled, updateSettings } = useLayout();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vimModeRef = useRef<any>(null);

  const toggleVimMode = useCallback(() => {
    console.log("Toggle Vim mode clicked! Current state:", vimModeEnabled);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = (globalThis as any).currentEditorRef;
    if (!editorRef?.current) {
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
  }, [vimModeEnabled, updateSettings]);

  const initializeVimMode = useCallback(
    (editor: unknown) => {
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
            vimModeRef.current = vimMode;
            console.log("monaco-vim initialized successfully!");
          } catch (error) {
            console.error("Failed to initialize monaco-vim:", error);
          }
        })
        .catch((error) => {
          console.error("Failed to load monaco-vim:", error);
        });
    },
    [vimModeEnabled]
  );

  const cleanupVimMode = useCallback(() => {
    if (vimModeRef.current) {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }
  }, []);

  return {
    vimModeEnabled,
    vimModeRef,
    toggleVimMode,
    initializeVimMode,
    cleanupVimMode,
  };
}
