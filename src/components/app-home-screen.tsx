"use client";

import Link from "next/link";
import { ArrowUp, Check, LoaderCircle, RotateCcw } from "lucide-react";
import { useState, type FormEvent } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import type { LedgerEntryPreview, LedgerSummary } from "@/lib/ledger/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AppHomeScreenProps = {
  ledgers: LedgerSummary[];
};

export function AppHomeScreen({ ledgers }: AppHomeScreenProps) {
  const [selectedLedgerId, setSelectedLedgerId] = useState(ledgers[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<LedgerEntryPreview | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim() || !selectedLedgerId) {
      return;
    }

    setError(null);
    setSavedMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/entries/preview", {
        body: JSON.stringify({
          ledgerId: selectedLedgerId,
          prompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
        preview?: LedgerEntryPreview;
      };

      if (!response.ok || !data.preview) {
        throw new Error(data.error ?? "Failed to generate ledger preview.");
      }

      setPreview(data.preview);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to generate ledger preview.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!preview) {
      return;
    }

    setError(null);
    setSavedMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/entries/confirm", {
        body: JSON.stringify({
          entry: preview.entry,
          ledgerId: preview.ledger.id,
          model: preview.model,
          sourcePrompt: preview.sourcePrompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save ledger entry.");
      }

      setPreview(null);
      setPrompt("");
      setSavedMessage("Entry saved to the database.");
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to save ledger entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscardPreview() {
    setPreview(null);
    setError(null);
  }

  const selectedLedger = ledgers.find((ledger) => ledger.id === selectedLedgerId);
  const previewMetadata = preview?.entry.metadata;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 pb-10 pt-16 text-white sm:pb-12 sm:pt-20">
      <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
        <Link
          href="/journal"
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Journal
        </Link>
        <Link
          href="/settings"
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Settings
        </Link>
        <SignOutButton variant="ghost" />
      </div>

      <div className="w-full max-w-4xl space-y-4">
        {preview ? (
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">{preview.ledger.name}</p>
                <p className="text-xs text-zinc-500">{preview.model}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDiscardPreview}
                  disabled={isSaving}
                >
                  <RotateCcw className="size-4" />
                  Discard
                </Button>
                <Button type="button" onClick={handleConfirm} disabled={isSaving}>
                  {isSaving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Confirm
                </Button>
              </div>
            </div>
            <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Vendor</p>
                <p>{previewMetadata?.vendorName ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Payment Method
                </p>
                <p>{previewMetadata?.paymentMethod ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Reference
                </p>
                <p>{previewMetadata?.reference ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notes</p>
                <p>{previewMetadata?.notes ?? "-"}</p>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-sm leading-7 text-zinc-200">
              <code>{preview.beancountText}</code>
            </pre>
          </section>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[28px] border border-white/10 bg-zinc-900/80 p-3 shadow-2xl shadow-black/20"
        >
          <div className="px-3 pb-3">
            <select
              value={selectedLedgerId}
              onChange={(event) => setSelectedLedgerId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              {ledgers.map((ledger) => (
                <option key={ledger.id} value={ledger.id}>
                  {ledger.name}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the transaction in natural language..."
            className="min-h-28 resize-none border-0 bg-transparent px-3 py-3 text-base shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-2 pt-3">
            <div className="min-h-5 text-xs">
              {error ? (
                <p className="text-rose-400">{error}</p>
              ) : savedMessage ? (
                <p className="text-emerald-400">{savedMessage}</p>
              ) : (
                <p className="text-zinc-500">
                  {selectedLedger
                    ? `${selectedLedger.name} · ${selectedLedger.defaultCurrency}`
                    : "Select a ledger"}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim() || !selectedLedgerId || isGenerating || isSaving}
            >
              {isGenerating ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
              <span className="sr-only">Generate ledger preview</span>
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
