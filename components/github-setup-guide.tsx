import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertCircle } from "lucide-react";

export function GitHubSetupGuide() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          GitHub OAuth Setup Required
        </CardTitle>
        <CardDescription>
          To use GitHub authentication, you need to configure GitHub OAuth in
          your Supabase project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
              1
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Create GitHub OAuth App</h4>
              <p className="text-sm text-muted-foreground">
                Go to GitHub Settings and create a new OAuth App
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/settings/applications/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Create GitHub OAuth App
                </a>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
              2
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Configure OAuth App Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Application name</Badge>
                  <span className="text-muted-foreground">Your App Name</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Homepage URL</Badge>
                  <span className="text-muted-foreground">
                    http://localhost:3000
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Authorization callback URL</Badge>
                  <span className="text-muted-foreground">
                    https://your-project-ref.supabase.co/auth/v1/callback
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
              3
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Configure Supabase</h4>
              <p className="text-sm text-muted-foreground">
                Enable GitHub provider in your Supabase project dashboard
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Supabase Dashboard
                </a>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
              4
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Add GitHub Credentials</h4>
              <p className="text-sm text-muted-foreground">
                In Supabase Dashboard → Authentication → Providers → GitHub:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Enable GitHub provider</li>
                <li>• Add your GitHub Client ID</li>
                <li>• Add your GitHub Client Secret</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h5 className="font-medium mb-2">Need Help?</h5>
          <p className="text-sm text-muted-foreground">
            Check the{" "}
            <a
              href="https://supabase.com/docs/guides/auth/social-login/auth-github"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Supabase GitHub Auth documentation
            </a>{" "}
            for detailed setup instructions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
