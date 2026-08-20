import type { MetadataRoute } from "next";

import {
  APP_ICON_BACKGROUND,
  APP_ICON_FOREGROUND,
} from "@/lib/brand/render-ledger-app-icon";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: APP_ICON_BACKGROUND,
    description: "Natural-language bookkeeping with journal, receipts, and ledger commands.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "32x32",
        src: "/icon/32",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "192x192",
        src: "/icon/192",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "512x512",
        src: "/icon/512",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/icon/512",
        type: "image/png",
      },
    ],
    name: "Ledger Accounting",
    short_name: "Ledger",
    start_url: "/",
    theme_color: APP_ICON_BACKGROUND,
  };
}
