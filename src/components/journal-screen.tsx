"use client";

import Link from "next/link";
import { BookOpenText, Search, Terminal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { persistSelectedLedger } from "@/lib/ledger/persist-selected-ledger";
import { SignOutButton } from "@/components/sign-out-button";
import { EntryLabelsFields } from "@/components/entry-labels-fields";
import { Button } from "@/components/ui/button";
import type { EntryLabelValues } from "@/lib/ledger/entry-labels";
import { recordToLabelValues } from "@/lib/ledger/entry-labels";
import type { CommandExecutionResult } from "@/lib/ledger/commands/types";
import type {
  JournalQueryFilters,
  LedgerAccount,
  LedgerEntryRecord,
  LedgerSummary,
} from "@/lib/ledger/types";

type JournalScreenProps = {
  initialAccounts: LedgerAccount[];
  initialEntries: LedgerEntryRecord[];
  ledgers: LedgerSummary[];
};

const EMPTY_QUERY_FILTERS: JournalQueryFilters = {
  accountCategory: null,
  endDate: null,
  maxAmount: null,
  minAmount: null,
  payee: null,
  startDate: null,
  vendorName: null,
};

function formatMetadataValue(value: string | null | undefined) {
  return value?.trim() ? value : "-";
}

function formatAmount(amount: number, currency: string) {
  return `${amount.toFixed(2)} ${currency}`;
}

function applyManualFilters(
  entries: LedgerEntryRecord[],
  search: string,
  queryFilters: JournalQueryFilters,
  selectedAccountName: string,
  accounts: LedgerAccount[],
) {
  const query = search.trim().toLowerCase();
  const categoriesByAccount = new Map(
    accounts.map((account) => [account.name, account.category]),
  );

  return entries.filter((entry) => {
    const searchableText = [
      entry.description,
      entry.sourcePrompt,
      entry.metadata.vendorName,
      entry.metadata.paymentMethod,
      entry.metadata.reference,
      entry.metadata.notes,
      entry.beancountText,
      ...entry.postings.map((posting) => posting.account),
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();
    const payeeText = [entry.description, entry.metadata.vendorName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = query ? searchableText.includes(query) : true;
    const matchesAccount = selectedAccountName
      ? entry.postings.some((posting) => posting.account === selectedAccountName)
      : true;
    const matchesPayee = queryFilters.payee
      ? payeeText.includes(queryFilters.payee.toLowerCase())
      : true;
    const matchesAccountCategory = queryFilters.accountCategory
      ? entry.postings.some(
          (posting) =>
            categoriesByAccount.get(posting.account) === queryFilters.accountCategory,
        )
      : true;
    const matchesVendor = queryFilters.vendorName
      ? entry.metadata.vendorName
          ?.toLowerCase()
          .includes(queryFilters.vendorName.toLowerCase()) ?? false
      : true;
    const matchesStartDate = queryFilters.startDate
      ? entry.entryDate >= queryFilters.startDate
      : true;
    const matchesEndDate = queryFilters.endDate
      ? entry.entryDate <= queryFilters.endDate
      : true;
    const largestPostingAmount = Math.max(
      ...entry.postings.map((posting) => Math.abs(posting.amount)),
      0,
    );
    const matchesMinAmount = queryFilters.minAmount
      ? largestPostingAmount >= queryFilters.minAmount
      : true;
    const matchesMaxAmount = queryFilters.maxAmount
      ? largestPostingAmount <= queryFilters.maxAmount
      : true;

    return (
      matchesSearch &&
      matchesAccount &&
      matchesPayee &&
      matchesAccountCategory &&
      matchesVendor &&
      matchesStartDate &&
      matchesEndDate &&
      matchesMinAmount &&
      matchesMaxAmount
    );
  });
}

export function JournalScreen({
  initialAccounts,
  initialEntries,
  ledgers,
}: JournalScreenProps) {
  const [selectedLedgerId, setSelectedLedgerId] = useState(ledgers[0]?.id ?? "");
  const [selectedAccountName, setSelectedAccountName] = useState("");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState("");
  const [commandInput, setCommandInput] = useState("");
  const [commandResult, setCommandResult] = useState<CommandExecutionResult | null>(
    null,
  );
  const [queryFilters, setQueryFilters] =
    useState<JournalQueryFilters>(EMPTY_QUERY_FILTERS);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [reversingEntryId, setReversingEntryId] = useState<string | null>(null);

  const selectedLedger = useMemo(
    () => ledgers.find((ledger) => ledger.id === selectedLedgerId) ?? null,
    [ledgers, selectedLedgerId],
  );

  const fetchLedgerData = useCallback(async () => {
    if (!selectedLedgerId) {
      return null;
    }

    const [entriesResponse, accountsResponse] = await Promise.all([
      fetch(`/api/entries?ledgerId=${selectedLedgerId}`),
      fetch(`/api/accounts?ledgerId=${selectedLedgerId}`),
    ]);

    const entriesData = (await entriesResponse.json()) as {
      entries?: LedgerEntryRecord[];
      error?: string;
    };
    const accountsData = (await accountsResponse.json()) as {
      accounts?: LedgerAccount[];
      error?: string;
    };

    if (!entriesResponse.ok || !entriesData.entries) {
      throw new Error(entriesData.error ?? "Failed to load ledger entries.");
    }

    if (!accountsResponse.ok || !accountsData.accounts) {
      throw new Error(accountsData.error ?? "Failed to load ledger accounts.");
    }

    return {
      accounts: accountsData.accounts,
      entries: entriesData.entries,
    };
  }, [selectedLedgerId]);

  useEffect(() => {
    async function loadEntries() {
      setError(null);
      setIsLoading(true);

      try {
        const data = await fetchLedgerData();

        if (!data) {
          return;
        }

        setEntries(data.entries);
        setAccounts(data.accounts);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load ledger entries.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadEntries();
  }, [fetchLedgerData]);

  function applyCommandFilters(result: CommandExecutionResult) {
    setSelectedAccountName(result.filters.accountName ?? "");
    setSearch(result.filters.searchText ?? "");
    setQueryFilters({
      accountCategory: result.filters.accountCategory ?? null,
      endDate: result.filters.endDate ?? null,
      maxAmount: result.filters.maxAmount ?? null,
      minAmount: result.filters.minAmount ?? null,
      payee: result.filters.payee ?? null,
      startDate: result.filters.startDate ?? null,
      vendorName: result.filters.vendorName ?? null,
    });
  }

  async function handleCommandSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLedgerId || !commandInput.trim()) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsExecuting(true);

    try {
      const response = await fetch("/api/journal/execute", {
        body: JSON.stringify({
          input: commandInput,
          ledgerId: selectedLedgerId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
        result?: CommandExecutionResult;
      };

      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "Failed to execute journal command.");
      }

      setCommandResult(data.result);
      applyCommandFilters(data.result);
    } catch (commandError) {
      setError(
        commandError instanceof Error
          ? commandError.message
          : "Failed to execute journal command.",
      );
    } finally {
      setIsExecuting(false);
    }
  }

  function clearCommandState() {
    setCommandInput("");
    setCommandResult(null);
    setSelectedAccountName("");
    setSearch("");
    setQueryFilters(EMPTY_QUERY_FILTERS);
    setError(null);
  }

  function handleEntryUpdated(updatedEntry: LedgerEntryRecord) {
    setEntries((current) =>
      current.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)),
    );
    setError(null);
    setSuccessMessage("Entry labels updated.");
  }

  async function handleReverseEntry(entryId: string) {
    setError(null);
    setSuccessMessage(null);
    setReversingEntryId(entryId);

    try {
      const response = await fetch("/api/entries/reverse", {
        body: JSON.stringify({ entryId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to reverse entry.");
      }

      setSuccessMessage("Entry reversed. The original remains in the journal for audit history.");
      const refreshedData = await fetchLedgerData();

      if (refreshedData) {
        setEntries(refreshedData.entries);
        setAccounts(refreshedData.accounts);
      }
    } catch (reverseError) {
      setError(
        reverseError instanceof Error ? reverseError.message : "Failed to reverse entry.",
      );
    } finally {
      setReversingEntryId(null);
    }
  }

  const baseEntries = useMemo(() => {
    if (
      commandResult &&
      (commandResult.name === "register" || commandResult.name === "sum") &&
      commandResult.entries
    ) {
      return commandResult.entries;
    }

    return entries;
  }, [commandResult, entries]);

  const filteredEntries = useMemo(
    () =>
      applyManualFilters(
        baseEntries,
        search,
        queryFilters,
        selectedAccountName,
        accounts,
      ),
    [accounts, baseEntries, queryFilters, search, selectedAccountName],
  );

  const activeQueryLabels = [
    commandResult ? `Command: ${commandResult.commandLine}` : null,
    selectedAccountName ? `Account: ${selectedAccountName}` : null,
    queryFilters.payee ? `Payee: ${queryFilters.payee}` : null,
    queryFilters.accountCategory ? `Category: ${queryFilters.accountCategory}` : null,
    search.trim() ? `Search: ${search.trim()}` : null,
    queryFilters.vendorName ? `Vendor: ${queryFilters.vendorName}` : null,
    queryFilters.startDate ? `From: ${queryFilters.startDate}` : null,
    queryFilters.endDate ? `To: ${queryFilters.endDate}` : null,
    queryFilters.minAmount ? `Min: ${queryFilters.minAmount}` : null,
    queryFilters.maxAmount ? `Max: ${queryFilters.maxAmount}` : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Journal
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Confirmed entries
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to app
            </Link>
            <Link
              href="/settings"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Settings
            </Link>
            <SignOutButton variant="ghost" />
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <form
            onSubmit={handleCommandSubmit}
            className="mb-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4"
          >
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Command or natural language
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3">
                <Terminal className="size-4 shrink-0 text-zinc-500" />
                <input
                  value={commandInput}
                  onChange={(event) => setCommandInput(event.target.value)}
                  placeholder='register --vendor Tee --from 2026-08-01 or "how much did I spend on Tee in August?"'
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isExecuting || !commandInput.trim()}>
                  {isExecuting ? "Running..." : "Run"}
                </Button>
                <Button type="button" variant="secondary" onClick={clearCommandState}>
                  Clear
                </Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Commands: register, sum, balance, accounts, help. Type{" "}
              <span className="text-zinc-400">help</span> for syntax.
            </p>
          </form>

          {commandResult ? (
            <CommandResultPanel result={commandResult} />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Ledger
              </label>
              <select
                value={selectedLedgerId}
                onChange={(event) => {
                  const nextLedgerId = event.target.value;
                  setSelectedLedgerId(nextLedgerId);
                  clearCommandState();
                  void persistSelectedLedger(nextLedgerId);
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
                Account
              </label>
              <select
                value={selectedAccountName}
                onChange={(event) => setSelectedAccountName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              >
                <option value="">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id ?? account.name} value={account.name}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Search
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3">
                <Search className="size-4 text-zinc-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search description, vendor, notes, or account"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
            <p>
              {selectedLedger
                ? `${selectedLedger.name} · ${selectedLedger.defaultCurrency}${selectedAccountName ? ` · ${selectedAccountName}` : ""}`
                : "Select a ledger"}
            </p>
            <p>{filteredEntries.length} entries</p>
          </div>
          {activeQueryLabels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeQueryLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {successMessage ? (
          <p className="text-sm text-emerald-400">{successMessage}</p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading entries...</p>
        ) : filteredEntries.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <BookOpenText className="mx-auto size-8 text-zinc-500" />
            <p className="mt-4 text-sm text-zinc-400">
              No confirmed entries match this ledger and search yet.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEntryUpdated={handleEntryUpdated}
                onReverse={() => void handleReverseEntry(entry.id)}
                reversingEntryId={reversingEntryId}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CommandResultPanel({ result }: { result: CommandExecutionResult }) {
  return (
    <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.15em] text-cyan-300">
          {result.name}
        </span>
        <code className="text-sm text-zinc-200">{result.commandLine}</code>
      </div>

      {result.name === "sum" && result.total ? (
        <p className="text-2xl font-semibold text-white">
          {formatAmount(result.total.amount, result.total.currency)}
        </p>
      ) : null}
      {result.name === "sum" && result.total ? (
        <p className="mt-1 text-sm text-zinc-400">
          Across {result.total.entryCount} matching{" "}
          {result.total.entryCount === 1 ? "entry" : "entries"}
        </p>
      ) : null}

      {result.name === "balance" && result.balances ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="pb-2 pr-4 font-medium">Account</th>
                <th className="pb-2 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {result.balances.map((row) => (
                <tr key={row.account} className="border-t border-white/5 text-zinc-200">
                  <td className="py-2 pr-4">{row.account}</td>
                  <td className="py-2">{formatAmount(row.amount, row.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {result.name === "accounts" && result.accounts ? (
        <div className="space-y-2 text-sm text-zinc-200">
          {result.accounts.map((account) => (
            <div
              key={account.id ?? account.name}
              className="flex flex-col gap-1 border-t border-white/5 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{account.name}</span>
              <span className="text-zinc-500">{account.category}</span>
            </div>
          ))}
        </div>
      ) : null}

      {result.name === "help" && result.helpText ? (
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-zinc-300">
          {result.helpText}
        </pre>
      ) : null}
    </div>
  );
}

function EntryCard({
  entry,
  onEntryUpdated,
  onReverse,
  reversingEntryId,
}: {
  entry: LedgerEntryRecord;
  onEntryUpdated: (entry: LedgerEntryRecord) => void;
  onReverse: () => void;
  reversingEntryId: string | null;
}) {
  const [isEditingLabels, setIsEditingLabels] = useState(false);
  const [labels, setLabels] = useState<EntryLabelValues>(() => recordToLabelValues(entry));
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);

  useEffect(() => {
    setLabels(recordToLabelValues(entry));
    setIsEditingLabels(false);
    setLabelError(null);
  }, [entry]);

  async function handleSaveLabels() {
    setIsSavingLabels(true);
    setLabelError(null);

    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        body: JSON.stringify(labels),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const data = (await response.json()) as {
        entry?: LedgerEntryRecord;
        error?: string;
      };

      if (!response.ok || !data.entry) {
        throw new Error(data.error ?? "Failed to update entry labels.");
      }

      onEntryUpdated(data.entry);
      setIsEditingLabels(false);
    } catch (saveError) {
      setLabelError(
        saveError instanceof Error ? saveError.message : "Failed to update entry labels.",
      );
    } finally {
      setIsSavingLabels(false);
    }
  }

  return (
    <details className="rounded-3xl border border-white/10 bg-white/5">
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              {entry.entryDate}
            </p>
            <h2 className="mt-1 truncate text-base font-semibold text-white">
              {entry.description}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              <span>{formatMetadataValue(entry.metadata.vendorName)}</span>
              <span>·</span>
              <span>{entry.currency}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] ${
                  entry.status === "reversed"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {entry.status}
              </span>
              {entry.reversalOfEntryId ? (
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] text-cyan-300">
                  reversal entry
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-sm text-zinc-300 sm:text-right">
            <p>
              {Math.max(
                ...entry.postings.map((posting) => Math.abs(posting.amount)),
                0,
              ).toFixed(2)}{" "}
              {entry.currency}
            </p>
            <p className="text-xs text-zinc-500">{entry.modelName}</p>
          </div>
        </div>
      </summary>

      <div className="border-t border-white/10 px-5 pb-5 pt-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Labels</p>
            {isEditingLabels ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSavingLabels}
                  onClick={() => {
                    setLabels(recordToLabelValues(entry));
                    setIsEditingLabels(false);
                    setLabelError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isSavingLabels}
                  onClick={() => void handleSaveLabels()}
                >
                  {isSavingLabels ? "Saving..." : "Save labels"}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditingLabels(true)}
              >
                Edit labels
              </Button>
            )}
          </div>

          {isEditingLabels ? (
            <EntryLabelsFields
              disabled={isSavingLabels}
              idPrefix={`entry-${entry.id}`}
              onChange={setLabels}
              values={labels}
            />
          ) : (
            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Title</p>
                <p>{entry.description}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Vendor</p>
                <p>{formatMetadataValue(entry.metadata.vendorName)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Payment Method
                </p>
                <p>{formatMetadataValue(entry.metadata.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Reference</p>
                <p>{formatMetadataValue(entry.metadata.reference)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notes</p>
                <p>{formatMetadataValue(entry.metadata.notes)}</p>
              </div>
            </div>
          )}

          {labelError ? <p className="mt-3 text-sm text-rose-400">{labelError}</p> : null}
          {!isEditingLabels ? (
            <p className="mt-3 text-xs text-zinc-500">
              Label edits update the title and metadata only. Amounts and accounts stay unchanged.
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Postings
          </p>
          <div className="space-y-2 text-sm text-zinc-200">
            {entry.postings.map((posting, index) => (
              <div
                key={`${entry.id}-${posting.account}-${index}`}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{posting.account}</span>
                <span>
                  {posting.amount.toFixed(2)} {entry.currency}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-zinc-400">
              {entry.reversedByEntryId
                ? "This original entry has been reversed."
                : entry.reversalOfEntryId
                  ? "This is the reversing entry."
                  : "Use reversal instead of deletion so the audit trail stays intact."}
            </div>
            {!entry.reversalOfEntryId && !entry.reversedByEntryId ? (
              <Button
                type="button"
                variant="secondary"
                disabled={reversingEntryId === entry.id}
                onClick={onReverse}
              >
                {reversingEntryId === entry.id ? "Reversing..." : "Reverse entry"}
              </Button>
            ) : null}
          </div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Beancount text
          </p>
          <pre className="overflow-x-auto text-sm leading-7 text-zinc-300">
            <code>{entry.beancountText}</code>
          </pre>
        </div>
      </div>
    </details>
  );
}
