"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";

interface CreateRepositoryFormProps {
  onRepositoryCreated?: (repository: any) => void;
}

export function CreateRepositoryForm({
  onRepositoryCreated,
}: CreateRepositoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
    autoInit: true,
    gitignoreTemplate: "",
    licenseTemplate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("/api/github/create-repository", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create repository");
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        isPrivate: false,
        autoInit: true,
        gitignoreTemplate: "",
        licenseTemplate: "",
      });
      setIsOpen(false);

      // Notify parent component
      if (onRepositoryCreated) {
        onRepositoryCreated(data.repository);
      }

      alert("Repository created successfully!");
    } catch (error) {
      console.error("Error creating repository:", error);
      alert(
        `Failed to create repository: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Create New Repository
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Repository</CardTitle>
        <CardDescription>
          Create a new repository on your GitHub account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Repository Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="my-awesome-repo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="A brief description of your repository"
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
            <Label htmlFor="isPrivate">Make this repository private</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoInit"
              checked={formData.autoInit}
              onCheckedChange={(checked) =>
                handleInputChange("autoInit", checked)
              }
            />
            <Label htmlFor="autoInit">Initialize with README</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gitignoreTemplate">Gitignore Template</Label>
            <Input
              id="gitignoreTemplate"
              value={formData.gitignoreTemplate}
              onChange={(e) =>
                handleInputChange("gitignoreTemplate", e.target.value)
              }
              placeholder="Node, Python, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseTemplate">License Template</Label>
            <Input
              id="licenseTemplate"
              value={formData.licenseTemplate}
              onChange={(e) =>
                handleInputChange("licenseTemplate", e.target.value)
              }
              placeholder="MIT, Apache-2.0, etc."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isCreating || !formData.name}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Repository"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
