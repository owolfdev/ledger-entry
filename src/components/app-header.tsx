"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./ledger/header";

export function Header() {
  const pathname = usePathname();

  // Show layout toggles only on the ledger page
  const showLayoutToggles = pathname === "/ledger";

  return <AppHeader showLayoutToggles={showLayoutToggles} />;
}
