"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitHubAuthButton } from "@/components/github-auth-button";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Ledger Entry</CardTitle>
          <CardDescription>
            Sign in with your GitHub account to access your ledger files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <GitHubAuthButton />
            <p className="text-sm text-muted-foreground text-center">
              Your financial data will be stored securely in your private GitHub
              repositories
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
