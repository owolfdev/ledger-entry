"use client";

import Link from "next/link";
import { Save, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";

import { persistSelectedLedger } from "@/lib/ledger/persist-selected-ledger";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import type { LedgerSummary } from "@/lib/ledger/types";

type SettingsScreenProps = {
  ledgers: LedgerSummary[];
};

export function SettingsScreen({ ledgers }: SettingsScreenProps) {
  const [ledgerList, setLedgerList] = useState(ledgers);
  const [selectedLedgerId, setSelectedLedgerId] = useState(ledgers[0]?.id ?? "");
  const [currency, setCurrency] = useState(ledgers[0]?.defaultCurrency ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedLedger = useMemo(
    () => ledgerList.find((ledger) => ledger.id === selectedLedgerId) ?? null,
    [ledgerList, selectedLedgerId],
  );

  function handleLedgerChange(nextLedgerId: string) {
    setSelectedLedgerId(nextLedgerId);
    void persistSelectedLedger(nextLedgerId);

    const nextLedger = ledgerList.find((ledger) => ledger.id === nextLedgerId);
    setCurrency(nextLedger?.defaultCurrency ?? "");
    setMessage(null);
    setError(null);
  }

  async function handleSaveCurrency() {
    if (!selectedLedgerId || !currency.trim()) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/ledgers", {
        body: JSON.stringify({
          defaultCurrency: currency.trim().toUpperCase(),
          ledgerId: selectedLedgerId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const data = (await response.json()) as {
        error?: string;
        ledger?: LedgerSummary;
      };

      if (!response.ok || !data.ledger) {
        throw new Error(data.error ?? "Failed to update currency.");
      }

      setLedgerList((currentLedgers) =>
        currentLedgers.map((ledger) =>
          ledger.id === data.ledger!.id ? data.ledger! : ledger,
        ),
      );
      setCurrency(data.ledger.defaultCurrency);
      setMessage("Currency updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update currency.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Ledger settings
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to app
            </Link>
            <SignOutButton variant="ghost" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-2">
                <Settings2 className="size-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Currency</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Set the default 3-letter currency code for each ledger. The AI
                  will use this as the fallback when the prompt does not specify a
                  currency.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Ledger
                </label>
                <select
                  value={selectedLedgerId}
                  onChange={(event) => handleLedgerChange(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  {ledgerList.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Default currency
                </label>
                <input
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="THB"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm uppercase text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                onClick={handleSaveCurrency}
                disabled={isSaving || !selectedLedgerId || currency.trim().length !== 3}
              >
                <Save className="size-4" />
                Save currency
              </Button>
              <p className="text-sm text-zinc-500">
                {selectedLedger
                  ? `${selectedLedger.name} currently defaults to ${selectedLedger.defaultCurrency}`
                  : "Select a ledger"}
              </p>
            </div>

            <div className="mt-4 min-h-5 text-sm">
              {error ? (
                <p className="text-rose-400">{error}</p>
              ) : message ? (
                <p className="text-emerald-400">{message}</p>
              ) : null}
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Manage accounts</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Edit the chart of accounts used by each ledger. These accounts are
              the only ones the AI can post into.
            </p>
            <Link
              href="/settings/accounts"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Open accounts
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
