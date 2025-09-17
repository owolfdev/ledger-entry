import { GitHubAuthButton } from "@/components/github-auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, redirect to ledger interface
  if (user) {
    redirect("/ledger");
  }

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <span className="text-foreground">Ledger Entry</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <GitHubAuthButton />
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Ledger Entry
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              A natural language interface for Ledger CLI with GitHub-backed
              storage
            </p>
          </div>

          <div className="space-y-4">
            <GitHubAuthButton />
            <p className="text-sm text-muted-foreground">
              Your financial data will be stored securely in your private GitHub
              repositories
            </p>
          </div>

          <div className="pt-8">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Natural language transaction input</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Monaco Editor with Vim support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>GitHub-backed storage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Mobile-friendly interface</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
