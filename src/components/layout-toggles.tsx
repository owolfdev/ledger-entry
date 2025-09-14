"use client";

import { Button } from "@/src/components/ui/button";
import { useLayout } from "@/src/contexts/layout-context";
import { Terminal, FileText, Monitor } from "lucide-react";

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
    updateSettings({ showTerminal: !showTerminal });
  };

  const toggleEditor = () => {
    updateSettings({ showEditor: !showEditor });
  };

  const toggleBoth = () => {
    if (showTerminal && !showEditor) {
      // Currently showing terminal only, switch to editor only
      updateSettings({ showTerminal: false, showEditor: true });
    } else if (!showTerminal && showEditor) {
      // Currently showing editor only, switch to both
      updateSettings({ showTerminal: true, showEditor: true });
    } else if (showTerminal && showEditor) {
      // Currently showing both, switch to terminal only
      updateSettings({ showTerminal: true, showEditor: false });
    }
  };

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

      {/* Cycle Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleBoth}
        className="h-8 w-8 p-0"
        title={
          showTerminal && !showEditor
            ? "Switch to Editor"
            : !showTerminal && showEditor
            ? "Show Both"
            : "Switch to Terminal"
        }
      >
        <Monitor className="w-4 h-4" />
      </Button>
    </div>
  );
}
