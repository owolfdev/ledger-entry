"use client";

import { Button } from "@/src/components/ui/button";
import { useLayout } from "@/src/contexts/layout-context";
import { Terminal, FileText } from "lucide-react";

export function LayoutToggles() {
  const { showTerminal, showEditor, updateSettings, isLoaded } = useLayout();

  // Don't render until settings are loaded
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-6 h-6 border border-border rounded animate-pulse" />
        <div className="w-6 h-6 border border-border rounded animate-pulse" />
      </div>
    );
  }

  const toggleTerminal = () => {
    // Prevent turning off terminal if editor is already off
    if (showTerminal && !showEditor) {
      return; // Don't allow turning off terminal when editor is off
    }
    updateSettings({ showTerminal: !showTerminal });
  };

  const toggleEditor = () => {
    // Prevent turning off editor if terminal is already off
    if (showEditor && !showTerminal) {
      return; // Don't allow turning off editor when terminal is off
    }
    updateSettings({ showEditor: !showEditor });
  };

  // Removed cycle toggle to reduce redundancy; two explicit toggles suffice

  return (
    <div className="flex items-center gap-1">
      {/* Terminal Toggle */}
      <Button
        variant={showTerminal ? "default" : "ghost"}
        size="sm"
        onClick={toggleTerminal}
        className="h-8 w-8 p-0"
        title="Toggle Terminal"
      >
        <Terminal className="w-4 h-4" />
      </Button>

      {/* Editor Toggle */}
      <Button
        variant={showEditor ? "default" : "ghost"}
        size="sm"
        onClick={toggleEditor}
        className="h-8 w-8 p-0"
        title="Toggle Editor"
      >
        <FileText className="w-4 h-4" />
      </Button>

      {/* Cycle Toggle removed */}
    </div>
  );
}
