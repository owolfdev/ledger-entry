/**
 * Header Template for Migration
 *
 * This template shows how to integrate the layout components with your existing auth system.
 * Replace the placeholder auth component with your actual auth implementation.
 */

"use client";

import Link from "next/link";
import { LayoutToggles } from "./layout-toggles";
import { MobileNav } from "./mobile-nav";

// TODO: Replace this with your actual auth component
// import { YourAuthButton } from "@/src/components/your-auth-button";

// Placeholder auth component - replace with your actual implementation
function PlaceholderAuthButton() {
  return (
    <div className="px-3 py-2 text-sm text-muted-foreground border rounded">
      Auth Button Placeholder
    </div>
  );
}

export function HeaderTemplate() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="px-6 py-3 flex items-center">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-baseline gap-6">
          <Link
            href="/"
            className="text-xl font-bold hover:text-primary transition-colors"
          >
            Your App Name
          </Link>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          <MobileNav />
          <Link
            href="/"
            className="text-xl font-bold hover:text-primary transition-colors"
          >
            Your App Name
          </Link>
        </div>

        {/* Right Side Controls */}
        <div className="ml-auto flex items-center gap-4">
          <LayoutToggles />
          {/* Replace this with your actual auth component */}
          <PlaceholderAuthButton />
        </div>
      </div>
    </header>
  );
}

/**
 * Integration Instructions:
 *
 * 1. Copy this file to your project as `src/components/ledger/header.tsx`
 *
 * 2. Replace the PlaceholderAuthButton with your actual auth component:
 *    - Import your auth component
 *    - Replace <PlaceholderAuthButton /> with <YourAuthButton />
 *
 * 3. Update the app name and navigation links to match your project
 *
 * 4. Use this header in your main layout:
 *    ```tsx
 *    import { HeaderTemplate as LedgerHeader } from "@/src/components/ledger/header";
 *
 *    export default function RootLayout({ children }) {
 *      return (
 *        <html>
 *          <body>
 *            <LayoutProvider>
 *              <div className="min-h-screen flex flex-col">
 *                <LedgerHeader />
 *                <main className="flex-1">{children}</main>
 *              </div>
 *            </LayoutProvider>
 *          </body>
 *        </html>
 *      );
 *    }
 *    ```
 */
