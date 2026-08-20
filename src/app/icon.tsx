import { ImageResponse } from "next/og";

import { renderLedgerAppIcon } from "@/lib/brand/render-ledger-app-icon";

export const contentType = "image/png";

export function generateImageMetadata() {
  return [
    {
      contentType: "image/png",
      id: "32",
      size: { height: 32, width: 32 },
    },
    {
      contentType: "image/png",
      id: "192",
      size: { height: 192, width: 192 },
    },
    {
      contentType: "image/png",
      id: "512",
      size: { height: 512, width: 512 },
    },
  ];
}

export default function Icon({ id }: { id?: string }) {
  const parsedSize = id ? Number.parseInt(id, 10) : 32;
  const size = Number.isFinite(parsedSize) ? parsedSize : 32;

  return new ImageResponse(renderLedgerAppIcon(size), {
    height: size,
    width: size,
  });
}
