"use client";

import { usePoster } from "@/components/poster-provider";

const ATTRIBUTION_LINES: ReadonlyArray<readonly [themeId: string, lines: string[]]> = [
  ["satellite", ["Tiles © Esri"]],
  ["satellite-light", ["Tiles © Esri"]],
  ["satellite-dark", ["Tiles © Esri"]],
];

const DEFAULT_ATTRIBUTION = ["© CARTO", "© OpenStreetMap contributors"];

export function MapAttribution() {
  const { activities, config } = usePoster();
  const hasActivity = activities
    .slice(0, config.activityCount)
    .some((activity) => activity !== null);

  if (!hasActivity) return null;

  const match = ATTRIBUTION_LINES.find(([themeId]) => themeId === config.theme);
  const lines = match?.[1] ?? DEFAULT_ATTRIBUTION;

  return (
    <footer className="text-muted-foreground px-4 py-2.5 text-center text-[0.65rem]">
      {lines.map((line, idx) => (
        <span key={line}>
          {line}
          {idx < lines.length - 1 && (
            <span className="mx-1.5 opacity-60">·</span>
          )}
        </span>
      ))}
    </footer>
  );
}
