export const APP_ICON_BACKGROUND = "#09090b";
export const APP_ICON_FOREGROUND = "#22d3ee";

const BOOK_OPEN_TEXT_PATHS = [
  "M12 5v16",
  "M16 13h2",
  "M16 9h2",
  "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
  "M6 13h2",
  "M6 9h2",
] as const;

export function buildLedgerAppIconSvg(size: number) {
  const paths = BOOK_OPEN_TEXT_PATHS.map((path) => `<path d="${path}" />`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="4.8" fill="${APP_ICON_BACKGROUND}" />
  <g stroke="${APP_ICON_FOREGROUND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${paths}
  </g>
</svg>`;
}

export function buildLedgerAppIconDataUri(size: number) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildLedgerAppIconSvg(size))}`;
}
