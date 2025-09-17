import { LedgerHeader } from "@/components/ledger/header";
import LedgerInterface from "@/components/ledger/ledger-interface";

export default function LedgerPage() {
  return (
    <div className="h-screen flex flex-col">
      <LedgerHeader />
      <main className="flex-1 overflow-hidden">
        <LedgerInterface />
      </main>
    </div>
  );
}
