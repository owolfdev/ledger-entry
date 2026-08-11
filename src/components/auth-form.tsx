"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  nextPath?: string;
  userEmail: string | null;
};

export function AuthForm({ nextPath = "/", userEmail }: AuthFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState(userEmail ?? "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  async function handleSignOut() {
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    setMessage("Signed out.");
    setIsLoading(false);
  }

  if (userEmail) {
    return (
      <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="text-sm font-medium text-emerald-300">Signed in</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{userEmail}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80">
          Your Supabase session is active and available in server components,
          route handlers, and middleware.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoading}
          className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Signing out..." : "Sign out"}
        </button>
        {message ? <p className="mt-3 text-sm text-emerald-100">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-zinc-300">Sign in with email</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
          Enter your email and password. This form only signs in existing users.
        </p>
      </div>
      <form onSubmit={handleSignIn} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 rounded-full border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-cyan-400"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="min-w-0 rounded-full border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </section>
  );
}
