import Link from "next/link";
import { LayoutToggles } from "./layout-toggles";
import { MobileNav } from "./mobile-nav";
import { GitHubAuthButton } from "@/components/github-auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface AppHeaderProps {
  showLayoutToggles?: boolean;
}

export function AppHeader({ showLayoutToggles = false }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="px-6 py-3 flex items-center">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-baseline gap-6">
          <Link
            href="/"
            className="text-xl font-bold hover:text-primary transition-colors"
          >
            Ledger Entry
          </Link>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/configure-github"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Configure GitHub
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          <MobileNav />
          <Link
            href="/"
            className="text-xl font-bold hover:text-primary transition-colors"
          >
            Ledger Entry
          </Link>
        </div>

        {/* Right Side Controls */}
        <div className="ml-auto flex items-center gap-4">
          <ThemeSwitcher />
          {showLayoutToggles && <LayoutToggles />}
          <GitHubAuthButton />
        </div>
      </div>
    </header>
  );
}
