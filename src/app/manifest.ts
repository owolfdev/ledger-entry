import type { MetadataRoute } from "next";

import { APP_ICON_BACKGROUND } from "@/lib/brand/ledger-app-icon-svg";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: APP_ICON_BACKGROUND,
    description: "Natural-language bookkeeping with journal, receipts, and ledger commands.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "32x32",
        src: "/icons/icon.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "180x180",
        src: "/icons/apple-icon.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "192x192",
        src: "/icons/icon-192.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "512x512",
        src: "/icons/icon-512.png",
        type: "image/png",
      },
    ],
    name: "Ledger Accounting",
    short_name: "Ledger",
    start_url: "/",
    theme_color: APP_ICON_BACKGROUND,
  };
}
