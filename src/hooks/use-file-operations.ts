"use client";

import { useState, useCallback } from "react";

interface FileContent {
  content: string;
  path: string;
}

interface UseFileOperationsProps {
  owner: string;
  repo: string;
}

export function useFileOperations({ owner, repo }: UseFileOperationsProps) {
  const [currentFile, setCurrentFile] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  const loadFile = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/github/files?owner=${owner}&repo=${repo}&path=${encodeURIComponent(
            path
          )}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }

        const data = await response.json();
        setCurrentFile({ content: data.content, path: data.path });
        setIsModified(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    },
    [owner, repo]
  );

  const saveFile = useCallback(
    async (content: string, message?: string) => {
      if (!currentFile) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/github/files", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner,
            repo,
            path: currentFile.path,
            content,
            message: message || `Update ${currentFile.path}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save file: ${response.statusText}`);
        }

        setCurrentFile((prev) => (prev ? { ...prev, content } : null));
        setIsModified(false);

        // Invalidate rules cache if a rule file was saved
        if (
          currentFile.path.startsWith("rules/") &&
          currentFile.path.endsWith(".json")
        ) {
          try {
            const { invalidateRulesCache } = await import(
              "@/lib/commands/natural-language/rules-engine"
            );
            invalidateRulesCache(owner, repo);
            // console.log(
            //   `🗑️ Rules cache invalidated due to ${currentFile.path} save`
            // );
          } catch (_error) {
            // console.warn("Failed to invalidate rules cache:", error);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save file");
      } finally {
        setLoading(false);
      }
    },
    [owner, repo, currentFile]
  );

  const updateContent = useCallback(
    (content: string) => {
      if (currentFile) {
        setCurrentFile((prev) => (prev ? { ...prev, content } : null));
        setIsModified(true);
      }
    },
    [currentFile]
  );

  const clearFile = useCallback(() => {
    setCurrentFile(null);
    setIsModified(false);
    setError(null);
  }, []);

  return {
    currentFile,
    loading,
    error,
    isModified,
    loadFile,
    saveFile,
    updateContent,
    clearFile,
  };
}
