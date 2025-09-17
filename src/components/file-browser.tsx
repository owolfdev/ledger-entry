"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ledger/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
  expanded?: boolean;
}

interface FileBrowserProps {
  owner: string;
  repo: string;
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

export function FileBrowser({
  owner,
  repo,
  onFileSelect,
  selectedFile,
}: FileBrowserProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/files?owner=${owner}&repo=${repo}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    if (owner && repo) {
      fetchFiles();
    }
  }, [owner, repo, fetchFiles]);

  const toggleExpanded = (path: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.path === path) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setFiles(updateNode(files));
  };

  const renderFileNode = (node: FileNode, depth = 0) => {
    const isSelected = selectedFile === node.path;
    const isExpanded = node.expanded;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-muted/50 rounded ${
            isSelected ? "bg-primary/10 text-primary" : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === "file") {
              onFileSelect(node.path);
            } else {
              toggleExpanded(node.path);
            }
          }}
        >
          {node.type === "dir" ? (
            <>
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )}
            </>
          ) : (
            <>
              <div className="w-4 h-4" />
              <FileText className="w-4 h-4 text-gray-500" />
            </>
          )}
          <span className="text-sm truncate">{node.name}</span>
          {node.type === "file" && node.name.endsWith(".journal") && (
            <Badge variant="secondary" className="ml-auto text-xs">
              journal
            </Badge>
          )}
        </div>
        {node.type === "dir" && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col border-r bg-background">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Files</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFiles}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {owner}/{repo}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading files...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="p-2">{files.map((node) => renderFileNode(node))}</div>
        )}
      </ScrollArea>
    </div>
  );
}
