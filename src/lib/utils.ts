import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

export function getBaseUrl() {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  // In browser, use window.location.origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // Server-side fallback - check if we're in development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Production fallback
  return "https://ledger-entry.vercel.app";
}

export function getAuthRedirectUrl() {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/auth/callback`;
}
