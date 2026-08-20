"use client";

import Link from "next/link";
import { ArrowUp, Camera, Check, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { persistSelectedLedger } from "@/lib/ledger/persist-selected-ledger";
import { SignOutButton } from "@/components/sign-out-button";
import { EntryLabelsFields } from "@/components/entry-labels-fields";
import type { EntryLabelValues } from "@/lib/ledger/entry-labels";
import { entryToLabelValues, rebuildPreviewFromLabels } from "@/lib/ledger/entry-labels";
import type { LedgerEntryPreview, LedgerSummary } from "@/lib/ledger/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AppHomeScreenProps = {
  ledgers: LedgerSummary[];
};

type PendingPreview = LedgerEntryPreview & {
  clientId: string;
};

function attachClientIds(previews: LedgerEntryPreview[]): PendingPreview[] {
  return previews.map((preview) => ({
    ...preview,
    clientId: crypto.randomUUID(),
  }));
}

export function AppHomeScreen({ ledgers }: AppHomeScreenProps) {
  const [selectedLedgerId, setSelectedLedgerId] = useState(ledgers[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<PendingPreview[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savingClientId, setSavingClientId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function loadPreviewsFromResponse(response: Response) {
    const data = (await response.json()) as {
      error?: string;
      previews?: LedgerEntryPreview[];
    };

    if (!response.ok || !data.previews?.length) {
      throw new Error(data.error ?? "Failed to generate ledger preview.");
    }

    setPreviews(attachClientIds(data.previews));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim() || !selectedLedgerId) {
      return;
    }

    setError(null);
    setSavedMessage(null);
    setPreviews([]);
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

      await loadPreviewsFromResponse(response);
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

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedLedgerId) {
      return;
    }

    setError(null);
    setSavedMessage(null);
    setPreviews([]);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("ledgerId", selectedLedgerId);
      formData.append("image", file);

      const response = await fetch("/api/entries/preview-image", {
        body: formData,
        method: "POST",
      });

      await loadPreviewsFromResponse(response);
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "Failed to generate preview from receipt photo.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleConfirm(preview: PendingPreview) {
    setError(null);
    setSavedMessage(null);
    setSavingClientId(preview.clientId);

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

      const remaining = previews.filter((item) => item.clientId !== preview.clientId);
      setPreviews(remaining);

      if (remaining.length === 0) {
        setPrompt("");
        setSavedMessage("Entry saved to the database.");
      } else {
        setSavedMessage(
          remaining.length === 1
            ? "Entry saved. 1 preview left to review."
            : `Entry saved. ${remaining.length} previews left to review.`,
        );
      }
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to save ledger entry.",
      );
    } finally {
      setSavingClientId(null);
    }
  }

  function handleDiscardPreview(clientId: string) {
    setPreviews((current) => current.filter((item) => item.clientId !== clientId));
    setError(null);
  }

  function handleUpdatePreviewLabels(clientId: string, labels: EntryLabelValues) {
    setPreviews((current) =>
      current.map((preview) => {
        if (preview.clientId !== clientId) {
          return preview;
        }

        try {
          const rebuilt = rebuildPreviewFromLabels(preview.entry, labels);

          return {
            ...preview,
            beancountText: rebuilt.beancountText,
            entry: rebuilt.entry,
          };
        } catch (updateError) {
          setError(
            updateError instanceof Error
              ? updateError.message
              : "Failed to update preview labels.",
          );
          return preview;
        }
      }),
    );
  }

  const selectedLedger = ledgers.find((ledger) => ledger.id === selectedLedgerId);
  const isSaving = savingClientId !== null;

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 px-4 pb-10 pt-4 text-white sm:relative sm:px-6 sm:pb-12 sm:pt-6">
      <header className="mb-6 flex justify-end gap-2 sm:absolute sm:right-6 sm:top-6 sm:mb-0">
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
      </header>

      <div className="flex w-full flex-1 items-start justify-center sm:items-center">
        <div className="w-full max-w-4xl space-y-4">
          {previews.length > 1 ? (
            <p className="px-1 text-sm text-zinc-400">
              {previews.length} entries to review
            </p>
          ) : null}

          {previews.map((preview, index) => (
            <PreviewCard
              key={preview.clientId}
              index={index}
              isSaving={savingClientId === preview.clientId}
              onConfirm={() => void handleConfirm(preview)}
              onDiscard={() => handleDiscardPreview(preview.clientId)}
              onLabelsChange={(labels) =>
                handleUpdatePreviewLabels(preview.clientId, labels)
              }
              preview={preview}
              showIndex={previews.length > 1}
            />
          ))}

          <div className="mx-auto w-full max-w-sm">
            <label
              htmlFor="home-ledger-select"
              className="mb-2 block text-sm font-medium text-zinc-400"
            >
              Ledger
            </label>
            <select
              id="home-ledger-select"
              value={selectedLedgerId}
              onChange={(event) => {
                const nextLedgerId = event.target.value;
                setSelectedLedgerId(nextLedgerId);
                void persistSelectedLedger(nextLedgerId);
              }}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              {ledgers.map((ledger) => (
                <option key={ledger.id} value={ledger.id}>
                  {ledger.name}
                </option>
              ))}
            </select>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full rounded-[28px] border border-white/10 bg-zinc-900/80 p-3 shadow-2xl shadow-black/20"
          >
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
              <div className="flex items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => void handleImageSelected(event)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  disabled={!selectedLedgerId || isGenerating || isSaving}
                  onClick={() => imageInputRef.current?.click()}
                >
                  {isGenerating ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  <span className="sr-only">Capture or upload receipt photo</span>
                </Button>
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
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function PreviewCard({
  index,
  isSaving,
  onConfirm,
  onDiscard,
  onLabelsChange,
  preview,
  showIndex,
}: {
  index: number;
  isSaving: boolean;
  onConfirm: () => void;
  onDiscard: () => void;
  onLabelsChange: (labels: EntryLabelValues) => void;
  preview: PendingPreview;
  showIndex: boolean;
}) {
  const [labels, setLabels] = useState<EntryLabelValues>(() =>
    entryToLabelValues(preview.entry),
  );

  useEffect(() => {
    setLabels(entryToLabelValues(preview.entry));
  }, [preview.clientId]);

  function handleLabelsChange(nextLabels: EntryLabelValues) {
    setLabels(nextLabels);
    onLabelsChange(nextLabels);
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {showIndex ? `${index + 1}. ${preview.ledger.name}` : preview.ledger.name}
          </p>
          <p className="text-xs text-zinc-500">{preview.entry.entryDate}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onDiscard} disabled={isSaving}>
            <RotateCcw className="size-4" />
            Discard
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Confirm
          </Button>
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
        <EntryLabelsFields
          disabled={isSaving}
          idPrefix={preview.clientId}
          onChange={handleLabelsChange}
          values={labels}
        />
      </div>
      <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-sm leading-7 text-zinc-200">
        <code>{preview.beancountText}</code>
      </pre>
    </section>
  );
}
