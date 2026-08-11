import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

function getSafeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const isSupabaseConfigured = hasSupabaseEnv();
  const resolvedSearchParams = await searchParams;
  const nextPath = getSafeNextPath(resolvedSearchParams.next);

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">
              Sign in
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Supabase is not configured yet.
            </h1>
            <p className="text-base leading-7 text-zinc-300">
              Add your Supabase URL and publishable key to <code>.env.local</code>,
              then come back to sign in.
            </p>
          </div>
          <Link
            href="/"
            className="w-fit rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">
            Sign in
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Access Ledger Accounting
          </h1>
          <p className="text-base leading-7 text-zinc-300">
            Enter your email and password to sign in. New accounts are not
            created from this form.
          </p>
        </div>
        <AuthForm nextPath={nextPath} userEmail={null} />
      </div>
    </main>
  );
}
