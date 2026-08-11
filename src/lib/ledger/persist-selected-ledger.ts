export async function persistSelectedLedger(ledgerId: string) {
  await fetch("/api/preferences/selected-ledger", {
    body: JSON.stringify({ ledgerId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}
