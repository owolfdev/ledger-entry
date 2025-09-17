import { useState, useEffect } from "react";

export interface UserSettings {
  // Panel visibility settings
  showTerminal: boolean;
  showEditor: boolean;

  // Editor settings
  vimModeEnabled: boolean;

  // Layout settings
  terminalSize: number; // percentage of screen
  editorSize: number; // percentage of screen
  splitterRatio: number; // ratio for desktop splitter (0.0 to 1.0, where 0.5 = 50/50)

  // User has interacted (so we don't override their preferences)
  hasUserInteracted: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  showTerminal: true,
  showEditor: true,
  vimModeEnabled: false, // Start with Vim disabled by default
  terminalSize: 40, // 40% terminal, 60% editor
  editorSize: 60,
  splitterRatio: 0.4, // 40% terminal, 60% editor (matches terminalSize/editorSize)
  hasUserInteracted: false,
};

const STORAGE_KEY = "ledger-cli-settings";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to handle new settings being added
        const mergedSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings to localStorage:", error);
      }
    }
  }, [settings, isLoaded]);

  // Update settings function
  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
      hasUserInteracted: true, // Mark that user has interacted
    }));
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Get mobile-appropriate defaults (both panels visible on mobile)
  const getMobileDefaults = (): Partial<UserSettings> => ({
    showTerminal: true,
    showEditor: true,
    terminalSize: 50, // Equal split on mobile
    editorSize: 50,
  });

  return {
    settings,
    updateSettings,
    resetSettings,
    getMobileDefaults,
    isLoaded,
  };
}
