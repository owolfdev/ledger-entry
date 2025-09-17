"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useSettings } from "@/hooks/use-settings";

interface LayoutContextType {
  showTerminal: boolean;
  showEditor: boolean;
  vimModeEnabled: boolean;
  terminalSize: number;
  editorSize: number;
  splitterRatio: number;
  updateSettings: (settings: Partial<Record<string, unknown>>) => void;
  isLoaded: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings, isLoaded } = useSettings();
  const {
    showTerminal,
    showEditor,
    vimModeEnabled,
    terminalSize,
    editorSize,
    splitterRatio,
  } = settings;

  return (
    <LayoutContext.Provider
      value={{
        showTerminal,
        showEditor,
        vimModeEnabled,
        terminalSize,
        editorSize,
        splitterRatio,
        updateSettings,
        isLoaded,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
