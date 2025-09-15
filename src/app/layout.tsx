import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { AuthButton } from "@/src/components/auth-button";
import { LayoutToggles } from "@/src/components/layout-toggles";
import { LayoutProvider } from "@/src/contexts/layout-context";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Ledger Entry",
  description:
    "A natural language interface for Ledger that makes it easy to use ledger remotely and on mobile devices",
  generator: "Next.js 15",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <LayoutProvider>
          <div className="min-h-screen flex flex-col">
            {/* Header with Layout Toggles and Auth Button */}
            <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
              <div className="px-6 py-3 flex items-center">
                <h1 className="text-xl font-bold">Ledger Entry</h1>
                <div className="ml-auto flex items-center gap-4">
                  <LayoutToggles />
                  <AuthButton />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">{children}</main>
          </div>
        </LayoutProvider>
        <Analytics />
      </body>
    </html>
  );
}
