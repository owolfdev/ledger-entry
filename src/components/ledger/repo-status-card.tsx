"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FolderOpen,
  FileText,
} from "lucide-react";
import { RepoInfo } from "@/lib/ledger/repo-scanner";

interface RepoStatusCardProps {
  repo: RepoInfo;
  isConnected?: boolean;
  onConnect?: (repo: RepoInfo) => void;
  onInitialize?: (repo: RepoInfo) => void;
}

export function RepoStatusCard({
  repo,
  isConnected,
  onConnect,
  onInitialize,
}: RepoStatusCardProps) {
  const structure = repo.ledgerStructure;
  const isCompatible = structure?.isCompatible || false;

  const getStatusIcon = () => {
    if (isCompatible) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (isConnected) {
      return <Badge variant="secondary">Connected</Badge>;
    }
    if (isCompatible) {
      return <Badge variant="secondary">Compatible</Badge>;
    }
    return <Badge variant="destructive">Incompatible</Badge>;
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        isConnected ? "ring-2 ring-border" : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg text-foreground">
              {repo.name}
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-muted-foreground">
          {repo.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repository Info */}
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>{repo.full_name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <FileText className="h-4 w-4" />
            <span>{repo.private ? "Private" : "Public"} repository</span>
          </div>
        </div>

        {/* Structure Status */}
        {structure && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Ledger Structure:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {structure.hasMainJournal ? (
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                )}
                <span className="text-foreground">main.journal</span>
              </div>
              <div className="flex items-center gap-2">
                {structure.hasAccountsJournal ? (
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                )}
                <span className="text-foreground">accounts.journal</span>
              </div>
              <div className="flex items-center gap-2">
                {structure.hasEntriesFolder ? (
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                )}
                <span className="text-foreground">entries/ folder</span>
              </div>
              <div className="flex items-center gap-2">
                {structure.hasRulesFolder ? (
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                )}
                <span className="text-foreground">rules/ folder</span>
              </div>
            </div>
          </div>
        )}

        {/* Missing Files/Folders */}
        {structure && !isCompatible && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
              Missing:
            </h4>
            <div className="space-y-1">
              {structure.missingFiles.map((file) => (
                <div
                  key={file}
                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{file}</span>
                </div>
              ))}
              {structure.missingFolders.map((folder) => (
                <div
                  key={folder}
                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{folder}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isCompatible && !isConnected && onConnect && (
            <Button onClick={() => onConnect(repo)} size="sm">
              Connect
            </Button>
          )}
          {!isCompatible && onInitialize && (
            <Button
              onClick={() => onInitialize(repo)}
              size="sm"
              variant="outline"
            >
              Initialize
            </Button>
          )}
          {isConnected && (
            <Button size="sm" variant="outline" disabled>
              Currently Connected
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
