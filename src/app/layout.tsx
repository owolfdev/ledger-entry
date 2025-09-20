import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LayoutProvider } from "@/contexts/layout-context";
import { Header } from "@/components/app-header";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Ledger Entry",
  description:
    "A natural language interface for Ledger CLI with GitHub-backed storage",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${geistSans.className} antialiased h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutProvider>
            <div className="h-screen flex flex-col">
              <Header />
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
