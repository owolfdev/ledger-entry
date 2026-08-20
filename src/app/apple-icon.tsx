import { ImageResponse } from "next/og";

import { renderLedgerAppIcon } from "@/lib/brand/render-ledger-app-icon";

export const size = {
  height: 180,
  width: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(renderLedgerAppIcon(size.width), size);
}
