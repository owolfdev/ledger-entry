"use client";

import Link from "next/link";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { persistSelectedLedger } from "@/lib/ledger/persist-selected-ledger";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import type {
  AccountCategory,
  LedgerAccount,
  LedgerSummary,
} from "@/lib/ledger/types";

type AccountsSettingsScreenProps = {
  initialAccounts: LedgerAccount[];
  ledgers: LedgerSummary[];
};

const CATEGORY_OPTIONS: AccountCategory[] = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
];

type FormState = {
  category: AccountCategory;
  description: string;
  name: string;
};

const EMPTY_FORM: FormState = {
  category: "asset",
  description: "",
  name: "",
};

export function AccountsSettingsScreen({
  initialAccounts,
  ledgers,
}: AccountsSettingsScreenProps) {
  const [selectedLedgerId, setSelectedLedgerId] = useState(ledgers[0]?.id ?? "");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedLedger = useMemo(
    () => ledgers.find((ledger) => ledger.id === selectedLedgerId) ?? null,
    [ledgers, selectedLedgerId],
  );

  useEffect(() => {
    async function loadAccounts() {
      if (!selectedLedgerId) {
        return;
      }

      setError(null);
      setMessage(null);
      setEditingAccountId(null);
      setForm(EMPTY_FORM);
      setIsLoadingAccounts(true);

      try {
        const response = await fetch(`/api/accounts?ledgerId=${selectedLedgerId}`);
        const data = (await response.json()) as {
          accounts?: LedgerAccount[];
          error?: string;
        };

        if (!response.ok || !data.accounts) {
          throw new Error(data.error ?? "Failed to load accounts.");
        }

        setAccounts(data.accounts);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load accounts.",
        );
      } finally {
        setIsLoadingAccounts(false);
      }
    }

    void loadAccounts();
  }, [selectedLedgerId]);

  function resetForm() {
    setEditingAccountId(null);
    setForm(EMPTY_FORM);
  }

  function startEditing(account: LedgerAccount) {
    setEditingAccountId(account.id ?? null);
    setForm({
      category: account.category,
      description: account.description ?? "",
      name: account.name,
    });
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLedgerId || !form.name.trim()) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const method = editingAccountId ? "PATCH" : "POST";
      const response = await fetch("/api/accounts", {
        body: JSON.stringify({
          accountId: editingAccountId,
          category: form.category,
          description: form.description.trim() || null,
          ledgerId: selectedLedgerId,
          name: form.name.trim(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method,
      });

      const data = (await response.json()) as {
        account?: LedgerAccount;
        error?: string;
      };

      if (!response.ok || !data.account) {
        throw new Error(data.error ?? "Failed to save account.");
      }

      setAccounts((currentAccounts) => {
        if (editingAccountId) {
          return currentAccounts.map((account) =>
            account.id === editingAccountId ? data.account! : account,
          );
        }

        return [...currentAccounts, data.account!].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      });

      setMessage(editingAccountId ? "Account updated." : "Account added.");
      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save account.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(accountId: string | undefined) {
    if (!accountId || !selectedLedgerId) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/accounts", {
        body: JSON.stringify({
          accountId,
          ledgerId: selectedLedgerId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete account.");
      }

      setAccounts((currentAccounts) =>
        currentAccounts.filter((account) => account.id !== accountId),
      );
      setMessage("Account deleted.");

      if (editingAccountId === accountId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete account.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Chart of accounts
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to settings
            </Link>
            <SignOutButton variant="ghost" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Ledger
                </label>
                <select
                  value={selectedLedgerId}
                  onChange={(event) => {
                    const nextLedgerId = event.target.value;
                    setSelectedLedgerId(nextLedgerId);
                    void persistSelectedLedger(nextLedgerId);
                    setForm(EMPTY_FORM);
                    setEditingAccountId(null);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  {ledgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Account name
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Assets:Bank:Main"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as AccountCategory,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="What this account should be used for"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving || !form.name.trim()}>
                {editingAccountId ? (
                  <>
                    <Save className="size-4" />
                    Save account
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add account
                  </>
                )}
              </Button>
              {editingAccountId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              ) : null}
            </div>

            <div className="mt-4 min-h-5 text-sm">
              {error ? (
                <p className="text-rose-400">{error}</p>
              ) : message ? (
                <p className="text-emerald-400">{message}</p>
              ) : (
                <p className="text-zinc-500">
                  {selectedLedger
                    ? `${selectedLedger.name} · ${selectedLedger.defaultCurrency}`
                    : "Select a ledger"}
                </p>
              )}
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Accounts
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Use Beancount-style account names. These are the only accounts the
                AI can use for this ledger.
              </p>
            </div>

            {isLoadingAccounts ? (
              <p className="text-sm text-zinc-400">Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-zinc-400">No accounts yet.</p>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <article
                    key={account.id ?? account.name}
                    className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{account.name}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                          {account.category}
                        </p>
                        {account.description ? (
                          <p className="text-sm text-zinc-400">
                            {account.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEditing(account)}
                          disabled={isSaving}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleDelete(account.id)}
                          disabled={isSaving}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
