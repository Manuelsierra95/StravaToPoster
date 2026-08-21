"use client";

import { usePoster, type MapStyle } from "@/components/poster-provider";

const ATTRIBUTION_BY_STYLE: Record<MapStyle, string[]> = {
  default: ["© CARTO", "© OpenStreetMap contributors"],
  openstreetmap: ["© OpenStreetMap contributors", "MapLibre"],
  openstreetmap3d: ["© OpenStreetMap contributors", "MapLibre"],
  satellite: ["Tiles © Esri"],
};

export function MapAttribution() {
  const { activities, slotConfigs, config } = usePoster();
  const count = config.activityCount;

  const uniqueStyles = new Set<MapStyle>();
  for (let slot = 0; slot < count; slot++) {
    const activity = activities[slot];
    if (!activity) continue;
    const style = slotConfigs[slot]?.mapStyle;
    if (style) uniqueStyles.add(style);
  }

  const filledStyles = Array.from(uniqueStyles);

  if (filledStyles.length === 0) return null;

  return (
    <footer className="text-muted-foreground border-border border-t px-4 py-2.5 text-center text-[0.65rem]">
      {filledStyles.map((style, idx) => {
        const lines = ATTRIBUTION_BY_STYLE[style];
        return (
          <span key={style}>
            {lines.map((line, lineIdx) => (
              <span key={line}>
                {line}
                {lineIdx < lines.length - 1 && (
                  <span className="mx-1.5 opacity-60">·</span>
                )}
              </span>
            ))}
            {idx < filledStyles.length - 1 && (
              <span className="mx-2 opacity-40">|</span>
            )}
          </span>
        );
      })}
    </footer>
  );
}