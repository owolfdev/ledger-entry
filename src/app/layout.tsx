import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ledger Accounting",
  description:
    "Natural-language bookkeeping with journal, receipts, and ledger commands.",
  applicationName: "Ledger",
  appleWebApp: {
    title: "Ledger",
  },
  icons: {
    apple: [{ url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [{ url: "/icons/icon.png", sizes: "32x32", type: "image/png" }],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/icons/apple-icon.png",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
