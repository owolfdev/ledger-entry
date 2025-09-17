import { GitHubAuthButton } from "@/components/github-auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <span className="text-foreground">Ledger Entry</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ledger"
              className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90 transition"
            >
              Open Ledger Interface
            </Link>
            <Link
              href="/configure-github"
              className="inline-flex items-center rounded-md bg-foreground text-background px-3 py-2 text-xs font-medium hover:opacity-90 transition"
            >
              Configure GitHub
            </Link>
            <ThemeSwitcher />
            <GitHubAuthButton />
          </div>
        </div>
      </nav>
    </main>
  );
}
