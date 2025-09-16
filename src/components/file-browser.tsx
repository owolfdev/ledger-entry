"use client";

import { GitHubFile } from "@/lib/github/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  File,
  Folder,
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Plus,
  GitBranch,
} from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface FileBrowserProps {
  owner: string;
  repo: string;
  files: GitHubFile[];
  currentPath: string;
  currentBranch: string;
}

export function FileBrowser({
  owner,
  repo,
  files,
  currentPath,
  currentBranch,
}: FileBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const navigateToPath = (path: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("path", path);
    window.location.href = url.toString();
  };

  const goBack = () => {
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.join("/");
    navigateToPath(newPath);
  };

  const handleFileClick = async (file: GitHubFile) => {
    if (file.type === "dir") {
      navigateToPath(file.path);
    } else {
      setSelectedFile(file);
      setIsLoading(true);
      setIsEditing(false);

      try {
        // This would need to be implemented as an API route
        const response = await fetch(
          `/api/repositories/${owner}/${repo}/files/${file.path}?branch=${currentBranch}`
        );
        if (response.ok) {
          const content = await response.text();
          setFileContent(content);
          setEditedContent(content);
        } else {
          setFileContent("Error loading file content");
        }
      } catch {
        setFileContent("Error loading file content");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(fileContent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(fileContent);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/repositories/${owner}/${repo}/files/${selectedFile.path}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: editedContent,
            branch: currentBranch,
            message: `Update ${selectedFile.name}`,
          }),
        }
      );

      if (response.ok) {
        setFileContent(editedContent);
        setIsEditing(false);
        alert("File saved successfully!");
      } else {
        const error = await response.text();
        alert(`Error saving file: ${error}`);
      }
    } catch (error) {
      alert(`Error saving file: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: GitHubFile) => {
    if (file.type === "dir") {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }

    // Get file extension for better icon display
    const extension = file.name.split(".").pop()?.toLowerCase();
    const iconClass = "h-4 w-4";

    // You could add more specific icons based on file type
    if (["js", "ts", "jsx", "tsx"].includes(extension || "")) {
      return <File className={`${iconClass} text-yellow-500`} />;
    } else if (["css", "scss", "sass"].includes(extension || "")) {
      return <File className={`${iconClass} text-blue-400`} />;
    } else if (["html", "htm"].includes(extension || "")) {
      return <File className={`${iconClass} text-orange-500`} />;
    } else if (["json", "yaml", "yml"].includes(extension || "")) {
      return <File className={`${iconClass} text-green-500`} />;
    } else if (["md", "txt"].includes(extension || "")) {
      return <File className={`${iconClass} text-gray-400`} />;
    }

    return <File className={`${iconClass} text-gray-500`} />;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* File List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              {currentBranch}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goBack}
                disabled={!currentPath}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New File
              </Button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={() => navigateToPath("")}
              className="hover:text-foreground transition-colors"
            >
              {owner}/{repo}
            </button>
            {currentPath && (
              <>
                <span>/</span>
                {currentPath.split("/").map((part, index, array) => {
                  const path = array.slice(0, index + 1).join("/");
                  const isLast = index === array.length - 1;
                  return (
                    <span key={path}>
                      {isLast ? (
                        <span className="text-foreground font-medium">
                          {part}
                        </span>
                      ) : (
                        <button
                          onClick={() => navigateToPath(path)}
                          className="hover:text-foreground transition-colors"
                        >
                          {part}
                        </button>
                      )}
                      {!isLast && <span>/</span>}
                    </span>
                  );
                })}
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleFileClick(file)}
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <div>
                    <div className="font-medium">{file.name}</div>
                    {file.type === "file" && (
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.type === "file" && file.download_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.download_url!, "_blank");
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {file.type === "file" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileClick(file);
                        handleEdit();
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {selectedFile ? selectedFile.name : "Select a file"}
            {selectedFile && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{selectedFile.type}</Badge>
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>•</span>
                <span>{selectedFile.path}</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    Loading file content...
                  </div>
                </div>
              ) : isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-96 font-mono text-sm"
                    placeholder="Edit file content..."
                  />
                  <div className="text-xs text-muted-foreground">
                    Editing {selectedFile.name} • {editedContent.length}{" "}
                    characters
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-auto max-h-96">
                    {fileContent || "No content available"}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Select a file to view its content
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
