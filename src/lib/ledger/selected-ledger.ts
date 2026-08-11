import { cookies } from "next/headers";

import type { LedgerSummary } from "@/lib/ledger/types";

export const SELECTED_LEDGER_COOKIE_NAME = "selected-ledger-id";

export async function getSelectedLedgerIdFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SELECTED_LEDGER_COOKIE_NAME)?.value ?? null;
}

export function prioritizeSelectedLedger(
  ledgers: LedgerSummary[],
  selectedLedgerId: string | null,
) {
  if (!selectedLedgerId) {
    return ledgers;
  }

  const selectedLedger = ledgers.find((ledger) => ledger.id === selectedLedgerId);

  if (!selectedLedger) {
    return ledgers;
  }

  return [
    selectedLedger,
    ...ledgers.filter((ledger) => ledger.id !== selectedLedgerId),
  ];
}
