"use client";

import { useState } from "react";
import { LedgerTemplate, LEDGER_TEMPLATES } from "@/lib/ledger/templates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Globe, DollarSign } from "lucide-react";

interface TemplateSelectorProps {
  onTemplateSelect: (template: LedgerTemplate) => void;
  selectedTemplate?: LedgerTemplate;
}

export function TemplateSelector({
  onTemplateSelect,
  selectedTemplate,
}: TemplateSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Ledger Template</h2>
        <p className="text-muted-foreground">
          Select a template that matches your location and currency preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LEDGER_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id
                ? "ring-2 ring-primary bg-primary/5"
                : hoveredTemplate === template.id
                ? "ring-1 ring-primary/50"
                : ""
            }`}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {template.currency}
                  </Badge>
                  {selectedTemplate?.id === template.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Sample Transaction:
                  </h4>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    {template.sampleTransaction}
                  </code>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    Accounts ({template.accounts.length}):
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {template.accounts.slice(0, 3).map((account) => (
                      <div key={account.name} className="truncate">
                        {account.name}
                      </div>
                    ))}
                    {template.accounts.length > 3 && (
                      <div className="text-muted-foreground">
                        +{template.accounts.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <div className="flex justify-center">
          <Button
            onClick={() => onTemplateSelect(selectedTemplate)}
            className="px-8"
            size="lg"
          >
            Continue with {selectedTemplate.name}
          </Button>
        </div>
      )}
    </div>
  );
}
