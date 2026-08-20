import type { ReactElement } from "react";

const BOOK_OPEN_TEXT_PATHS = [
  "M12 5v16",
  "M16 13h2",
  "M16 9h2",
  "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
  "M6 13h2",
  "M6 9h2",
] as const;

export const APP_ICON_BACKGROUND = "#09090b";
export const APP_ICON_FOREGROUND = "#22d3ee";

export function renderLedgerAppIcon(size: number): ReactElement {
  const padding = Math.round(size * 0.18);
  const iconSize = size - padding * 2;
  const radius = Math.round(size * 0.24);
  const strokeWidth = Math.max(1.75, size / 14);

  return (
    <div
      style={{
        alignItems: "center",
        background: APP_ICON_BACKGROUND,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
        borderRadius: radius,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={APP_ICON_FOREGROUND}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {BOOK_OPEN_TEXT_PATHS.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </div>
  );
}
