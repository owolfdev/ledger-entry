import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    redirect("/login?next=/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-8 px-6 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">
              Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Protected route is working.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-300">
              This page is only available to authenticated users. Unauthenticated
              requests are redirected to <code>/login</code> and then sent back
              here after a successful sign-in.
            </p>
          </div>
          <Link
            href="/"
            className="w-fit rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Back home
          </Link>
        </div>

        <AuthForm userEmail={user.email ?? null} />
      </div>
    </main>
  );
}
