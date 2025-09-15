# GitHub Authentication Setup Guide

This document explains the successful GitHub OAuth authentication configuration using Supabase, including the issues we faced and how we resolved them.

## 🎯 Overview

We successfully implemented GitHub OAuth authentication for the Ledger Entry application using Supabase as the authentication provider. The implementation uses the **Authorization Code Flow with PKCE** for secure authentication.

## 🏗️ Architecture

```
User → GitHub OAuth → Supabase → Next.js App
```

1. **Client-Side**: User clicks "Sign in with GitHub"
2. **OAuth Flow**: Redirects to GitHub for authorization
3. **Callback**: GitHub redirects back with authorization code
4. **Session Exchange**: Supabase exchanges code for session
5. **Success**: User is authenticated and redirected to main app

## 📁 File Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client configuration
│   └── auth.ts              # Authentication functions
├── hooks/
│   └── use-auth.ts          # React hook for auth state
├── components/
│   └── auth-button.tsx      # Sign in/out UI component
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts     # OAuth callback handler
│   │   ├── implicit-callback/
│   │   │   └── page.tsx     # Client-side implicit flow handler
│   │   └── auth-code-error/
│   │       └── page.tsx     # Error page
│   └── layout.tsx           # Root layout with auth button
```

## 🔧 Configuration

### 1. Supabase Client Setup

**File**: `src/lib/supabase.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Client-side client (uses PKCE by default)
export const supabase = (() => {
  if (typeof window === "undefined") {
    return null as any;
  }

  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables are not set");
      return null as any;
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
})();

// Server-side client
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};
```

### 2. Authentication Functions

**File**: `src/lib/auth.ts`

```typescript
import { supabase } from "@/src/lib/supabase";

export const signInWithGitHub = async () => {
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo", // Request repository access
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
```

### 3. OAuth Callback Handler

**File**: `src/app/auth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=${encodeURIComponent(
            error.message
          )}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(
          "Authentication failed"
        )}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=${encodeURIComponent(
      "No authorization code provided"
    )}`
  );
}
```

## 🚨 Issues We Faced and Solutions

### Issue 1: Build Failures on Vercel

**Problem**: `supabaseKey is required` error during Vercel build

**Root Cause**: Environment variables not available during build time

**Solution**: Implemented lazy initialization of Supabase client

```typescript
// Before (caused build failures)
const supabase = createClient(url, key);

// After (lazy initialization)
export const supabase = (() => {
  if (typeof window === "undefined") {
    return null as any;
  }
  // ... initialize only on client side
})();
```

### Issue 2: Redirect to localhost in Production

**Problem**: After login, users were redirected to `localhost:3000` instead of production URL

**Root Cause**: Supabase Dashboard configuration

**Solution**: Updated Supabase Dashboard settings:

- **Site URL**: `https://ledger-entry.vercel.app`
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback` (for development)
  - `https://ledger-entry.vercel.app/auth/callback` (for production)

### Issue 3: Implicit Flow Instead of Authorization Code Flow

**Problem**: GitHub was using implicit flow (access token in URL fragment) instead of authorization code flow

**Root Cause**: Supabase was defaulting to implicit flow

**Solution**: Used `@supabase/ssr` package which uses PKCE (Authorization Code Flow) by default

```bash
npm install @supabase/ssr
```

### Issue 4: Auth Button Not Responding

**Problem**: Sign in button did nothing when clicked

**Root Cause**: Invalid PKCE configuration breaking the client

**Solution**: Removed invalid `flowType: 'pkce'` configuration

```typescript
// ❌ This broke the client
createBrowserClient(url, key, {
  auth: { flowType: "pkce" },
});

// ✅ This works (PKCE is default)
createBrowserClient(url, key);
```

### Issue 5: PKCE Code Verifier Mismatch

**Problem**: "both auth code and code verifier should be non-empty" error

**Root Cause**: Using regular `createClient` in callback instead of `createServerClient`

**Solution**: Used proper SSR client with cookie handling in callback route

```typescript
// ❌ This caused PKCE errors
const supabase = createClient(url, key);

// ✅ This handles PKCE properly
const supabase = createServerClient(url, key, {
  cookies: {
    /* cookie handlers */
  },
});
```

## 🔑 Environment Variables

### Required Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
```

### Vercel Environment Variables

Make sure to set these in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

## 🎯 Key Learnings

1. **Use `@supabase/ssr` Package**: Automatically handles PKCE flow correctly
2. **Lazy Initialization**: Prevents build failures when environment variables aren't available
3. **Proper Cookie Handling**: Essential for PKCE flow in server-side callbacks
4. **Supabase Dashboard Configuration**: Critical for production redirects
5. **Client-Server Consistency**: Use the same client type that generated the code challenge

## 🚀 Next Steps

With authentication working, you can now proceed to:

1. **GitHub Repository Management**: Create/connect user repositories
2. **PAT Vaulting**: Securely store GitHub Personal Access Tokens
3. **File Operations**: Read/write ledger files via GitHub API
4. **Ledger CLI Integration**: Build the microservice for running ledger commands

## 📚 References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OAuth 2.0 PKCE Flow](https://tools.ietf.org/html/rfc7636)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Status**: ✅ **Successfully Implemented and Deployed**

The GitHub OAuth authentication is now working correctly in production at [https://ledger-entry.vercel.app](https://ledger-entry.vercel.app).
