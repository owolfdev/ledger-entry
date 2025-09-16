"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, RefreshCw, ArrowLeft } from "lucide-react";

interface CreateRepoFormProps {
  onRepoCreated?: (repo: any) => void;
  onCancel?: () => void;
}

export function CreateRepoForm({
  onRepoCreated,
  onCancel,
}: CreateRepoFormProps) {
  const [formData, setFormData] = useState({
    name: `my-ledger-${Date.now()}`,
    description: "Personal finance tracker using Ledger CLI",
    isPrivate: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Repository name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch("/api/github/create-repository", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create repository");
      }

      const result = await response.json();
      onRepoCreated?.(result.repository);
    } catch (err) {
      console.error("Error creating repository:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-500" />
          Create New Repository
        </CardTitle>
        <CardDescription>
          Create a new repository with the proper ledger structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Repository Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="my-ledger"
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be the name of your GitHub repository
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Personal finance tracker using Ledger CLI"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrivate"
              checked={formData.isPrivate}
              onCheckedChange={(checked) =>
                handleInputChange("isPrivate", checked)
              }
            />
            <Label htmlFor="isPrivate" className="text-sm">
              Make this repository private
            </Label>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Repository
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-md">
          <h4 className="text-sm font-medium text-foreground mb-2">
            What will be created:
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• A new GitHub repository with your chosen name</li>
            <li>• main.journal - Main ledger file with includes</li>
            <li>• accounts.journal - Chart of accounts</li>
            <li>• entries/ folder - Monthly transaction files</li>
            <li>• rules/ folder - JSON rules for automation</li>
            <li>• Repository will be automatically connected</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
