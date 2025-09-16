"use client";

import { generateLedgerStructure } from "@/lib/ledger/structure";
import { LedgerTemplate } from "@/lib/ledger/templates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Folder, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FileStructurePreviewProps {
  template: LedgerTemplate;
  repository: string;
}

export function FileStructurePreview({
  template,
  repository,
}: FileStructurePreviewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const structure = generateLedgerStructure(template);

  const toggleFile = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const getFileIcon = (path: string) => {
    if (path.includes("/")) {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-green-500" />;
  };

  const getFileType = (path: string) => {
    if (path.endsWith(".journal")) return "Journal";
    if (path.endsWith(".json")) return "Rules";
    return "File";
  };

  const getFileTypeColor = (path: string) => {
    if (path.endsWith(".journal")) return "bg-green-100 text-green-800";
    if (path.endsWith(".json")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">File Structure Preview</h2>
        <p className="text-muted-foreground">
          These files will be created in your repository:{" "}
          <code className="bg-muted px-2 py-1 rounded text-sm">
            {repository}
          </code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Repository Structure
          </CardTitle>
          <CardDescription>
            {structure.files.length} files will be created with the{" "}
            {template.name} template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {structure.files.map((file) => {
              const isExpanded = expandedFiles.has(file.path);
              const isDirectory = file.path.includes("/");

              return (
                <div key={file.path} className="border rounded-lg">
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => isDirectory && toggleFile(file.path)}
                  >
                    {isDirectory ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                    {getFileIcon(file.path)}
                    <span className="font-mono text-sm">{file.path}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getFileTypeColor(file.path)}`}
                    >
                      {getFileType(file.path)}
                    </Badge>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {file.content.length} chars
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/20 p-3">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {file.content}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Included</CardTitle>
          <CardDescription>
            Your ledger will be set up with everything you need to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Core Files</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • <code>main.journal</code> - Main ledger file with includes
                </li>
                <li>
                  • <code>accounts.journal</code> - Chart of accounts (
                  {template.accounts.length} accounts)
                </li>
                <li>
                  • <code>entries/YYYY-MM.journal</code> - Monthly transaction
                  files
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Rules System</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • <code>rules/00-base.json</code> - Base configuration
                </li>
                <li>
                  • <code>rules/10-templates.json</code> - Template rules
                </li>
                <li>
                  • <code>rules/20-user.json</code> - Your custom rules
                </li>
                <li>
                  • <code>rules/30-learned.json</code> - Auto-learned rules
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
