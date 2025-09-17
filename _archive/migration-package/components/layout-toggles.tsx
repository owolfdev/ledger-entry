"use client";

import { Button } from "./ui/button";
import { useLayout } from "../contexts/layout-context";
import { Terminal, FileText } from "lucide-react";
import { useState, useEffect } from "react";

export function LayoutToggles() {
  const { showTerminal, showEditor, updateSettings, isLoaded } = useLayout();
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't render until settings are loaded
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-6 h-6 border border-border rounded animate-pulse" />
        <div className="w-6 h-6 border border-border rounded animate-pulse" />
      </div>
    );
  }

  const toggleMobile = () => {
    // Mobile: switch between terminal and editor
    if (showTerminal) {
      // Currently showing terminal, switch to editor
      updateSettings({ showTerminal: false, showEditor: true });
    } else {
      // Currently showing editor, switch to terminal
      updateSettings({ showTerminal: true, showEditor: false });
    }
  };

  const toggleTerminal = () => {
    // Desktop: prevent both panels from being hidden
    if (showTerminal && !showEditor) {
      return; // Don't allow turning off terminal when editor is off
    }
    updateSettings({ showTerminal: !showTerminal });
  };

  const toggleEditor = () => {
    // Desktop: prevent both panels from being hidden
    if (showEditor && !showTerminal) {
      return; // Don't allow turning off editor when terminal is off
    }
    updateSettings({ showEditor: !showEditor });
  };

  return (
    <div className="flex items-center gap-1">
      {isMobile ? (
        /* Mobile: Single toggle button */
        <Button
          variant="default"
          size="sm"
          onClick={toggleMobile}
          className="h-8 w-8 p-0"
          title={`Switch to ${showTerminal ? "Editor" : "Terminal"}`}
        >
          {showTerminal ? (
            <FileText className="w-4 h-4" />
          ) : (
            <Terminal className="w-4 h-4" />
          )}
        </Button>
      ) : (
        /* Desktop: Two separate toggle buttons */
        <>
          <Button
            variant={showTerminal ? "default" : "ghost"}
            size="sm"
            onClick={toggleTerminal}
            className="h-8 w-8 p-0"
            title="Toggle Terminal"
          >
            <Terminal className="w-4 h-4" />
          </Button>

          <Button
            variant={showEditor ? "default" : "ghost"}
            size="sm"
            onClick={toggleEditor}
            className="h-8 w-8 p-0"
            title="Toggle Editor"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}
