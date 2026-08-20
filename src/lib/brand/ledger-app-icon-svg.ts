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
  const padding = Math.round(size * 0.12);
  const iconSize = size - padding * 2;
  const strokeWidth = Math.max(2, size / 11);
  const paths = BOOK_OPEN_TEXT_PATHS.map(
    (path) =>
      `<path d="${path}" stroke="${APP_ICON_FOREGROUND}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="${APP_ICON_BACKGROUND}" />
  <svg x="${padding}" y="${padding}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none">
    ${paths}
  </svg>
</svg>`;
}

export function buildLedgerAppIconDataUri(size: number) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildLedgerAppIconSvg(size))}`;
}
