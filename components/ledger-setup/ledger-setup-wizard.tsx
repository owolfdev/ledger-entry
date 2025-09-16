"use client";

import { useState } from "react";
import { LedgerTemplate } from "@/lib/ledger/templates";
import { TemplateSelector } from "./template-selector";
import { FileStructurePreview } from "./file-structure-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface LedgerSetupWizardProps {
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    permissions: { push: boolean };
  }>;
  preselectedRepo?: string | null;
  onComplete: () => void;
}

type Step = "template" | "repository" | "preview" | "creating" | "complete";

export function LedgerSetupWizard({
  repositories,
  preselectedRepo,
  onComplete,
}: LedgerSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(
    preselectedRepo ? "repository" : "template"
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<LedgerTemplate | null>(null);
  const [selectedRepository, setSelectedRepository] = useState<string>(
    preselectedRepo || ""
  );
  const [pat, setPat] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<{
    success: boolean;
    createdFiles: string[];
    errors: string[];
  } | null>(null);

  const writableRepos = repositories.filter((repo) => repo.permissions.push);

  const handleTemplateSelect = (template: LedgerTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep("repository");
  };

  const handleRepositorySelect = (repo: string) => {
    setSelectedRepository(repo);
    setCurrentStep("preview");
  };

  const handleCreateLedger = async () => {
    if (!selectedTemplate || !selectedRepository || !pat) {
      return;
    }

    setIsCreating(true);
    setCurrentStep("creating");

    try {
      const response = await fetch("/api/github/ledger-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository: selectedRepository,
          templateId: selectedTemplate.id,
          pat: pat,
        }),
      });

      const result = await response.json();
      setCreationResult(result);

      if (result.success) {
        setCurrentStep("complete");
      } else {
        setCurrentStep("preview");
      }
    } catch (error) {
      setCreationResult({
        success: false,
        createdFiles: [],
        errors: [
          `Failed to create ledger files: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
      });
      setCurrentStep("preview");
    } finally {
      setIsCreating(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case "repository":
        setCurrentStep("template");
        break;
      case "preview":
        setCurrentStep("repository");
        break;
      case "creating":
        setCurrentStep("preview");
        break;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "template":
        return (
          <TemplateSelector
            onTemplateSelect={handleTemplateSelect}
            selectedTemplate={selectedTemplate}
          />
        );

      case "repository":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Select Repository</h2>
              <p className="text-muted-foreground">
                Choose where to create your ledger files
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="pat">GitHub Personal Access Token</Label>
                <Input
                  id="pat"
                  type="password"
                  placeholder="ghp_..."
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Required to create files in your repository. Make sure it has
                  'repo' scope.
                </p>
              </div>

              <div>
                <Label>Available Repositories</Label>
                <div className="grid gap-2 mt-2">
                  {writableRepos.map((repo) => (
                    <Card
                      key={repo.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedRepository === repo.full_name
                          ? "ring-2 ring-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => setSelectedRepository(repo.full_name)}
                    >
                      <CardContent className="p-3">
                        <div className="font-mono text-sm">
                          {repo.full_name}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {writableRepos.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No repositories with write access found. Make sure you
                      have push permissions to at least one repository.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => handleRepositorySelect(selectedRepository)}
                disabled={!selectedRepository || !pat}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-6">
            <FileStructurePreview
              template={selectedTemplate!}
              repository={selectedRepository}
            />

            {creationResult && !creationResult.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Failed to create some files:</p>
                    <ul className="list-disc list-inside text-sm">
                      {creationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleCreateLedger}
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Ledger Files
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "creating":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Creating Ledger Files</h2>
              <p className="text-muted-foreground">
                Setting up your ledger structure in {selectedRepository}...
              </p>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Ledger Created Successfully!
              </h2>
              <p className="text-muted-foreground">
                Your ledger has been set up in {selectedRepository}
              </p>
            </div>

            {creationResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Created Files</CardTitle>
                  <CardDescription>
                    {creationResult.createdFiles.length} files were created
                    successfully
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {creationResult.createdFiles.map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <code className="bg-muted px-2 py-1 rounded">
                          {file}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center gap-4">
              <Button onClick={onComplete} variant="outline">
                Close
              </Button>
              <Button
                onClick={() =>
                  window.open(
                    `https://github.com/${selectedRepository}`,
                    "_blank"
                  )
                }
                className="bg-gray-900 hover:bg-gray-800"
              >
                View on GitHub
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Setup Ledger</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Step{" "}
              {[
                "template",
                "repository",
                "preview",
                "creating",
                "complete",
              ].indexOf(currentStep) + 1}{" "}
              of 5
            </span>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                (([
                  "template",
                  "repository",
                  "preview",
                  "creating",
                  "complete",
                ].indexOf(currentStep) +
                  1) /
                  5) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      {renderStep()}
    </div>
  );
}
