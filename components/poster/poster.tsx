"use client";

import { Mountain } from "lucide-react";

import { usePoster, FONT_BY_ID } from "@/components/poster-provider";
import { hexToRgba } from "@/lib/poster-color";
import { cn } from "@/lib/utils";
import { ActivityPanel, ActivityPanelEmpty } from "./activity-panel";

export function Poster() {
  const { activities, slotConfigs, loadingBySlot, errorsBySlot, config } = usePoster();
  const isLandscape = config.orientation === "landscape";
  const count = config.activityCount;

  const filled = activities
    .slice(0, count)
    .map((activity, slot) => ({ activity, slot, slotConfig: slotConfigs[slot] }))
    .filter(
      (entry): entry is { activity: NonNullable<typeof entry.activity>; slot: number; slotConfig: typeof entry.slotConfig } =>
        entry.activity !== null,
    );

  const anyLoading = Object.values(loadingBySlot).some(Boolean);
  const firstError = Object.values(errorsBySlot).find((e) => e) ?? null;

  const posterStyle = {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    "--poster-bg": config.backgroundColor,
    "--poster-fg": config.textColor,
    "--poster-fg-muted": hexToRgba(config.textColor, 0.55),
    "--poster-border": hexToRgba(config.textColor, 0.18),
    "--poster-muted-bg": hexToRgba(config.textColor, 0.04),
    "--poster-heading-font": FONT_BY_ID[config.headingFont].cssVar,
    "--poster-body-font": FONT_BY_ID[config.bodyFont].cssVar,
  } as React.CSSProperties;

  const visibleCount = filled.length;
  const columnsOrRows = visibleCount > 0 ? visibleCount : 1;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-muted/30 p-4 lg:p-8">
      <div
        data-poster-scope
        style={posterStyle}
        className={cn(
          "relative flex w-full overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300",
          isLandscape
            ? "aspect-[4/3] max-h-[min(95vh,1100px)] max-w-[min(98vw,1500px)] min-w-[min(75vw,640px)] flex-col"
            : "aspect-[3/4] max-h-[min(98vh,1300px)] max-w-[min(98vw,900px)] min-w-[min(70vw,360px)] flex-row",
        )}
      >
        {visibleCount === 0 ? (
          <EmptyState loading={anyLoading} error={firstError} />
        ) : (
          <div
            className="flex h-full w-full min-h-0 min-w-0"
            style={{ flexDirection: isLandscape ? "column" : "row" }}
          >
            {filled.map(({ activity, slot, slotConfig }) => (
              <div
                key={activity.id}
                className="flex min-w-0 min-h-0 overflow-hidden"
                style={{ flex: "1 1 0", flexBasis: 0 }}
              >
                <ActivityPanel
                  activity={activity}
                  slot={slot}
                  slotConfig={slotConfig}
                  chartHeightMode={columnsOrRows >= 2 ? "compact" : "tall"}
                />
              </div>
            ))}
            {Array.from({ length: count - visibleCount }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className={cn(
                  "flex min-w-0 min-h-0 overflow-hidden border-dashed border-[var(--poster-border)]",
                  isLandscape ? "border-t" : "border-l",
                )}
                style={{ flex: "1 1 0", flexBasis: 0 }}
              >
                <ActivityPanelEmpty orientation={isLandscape ? "landscape" : "portrait"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ loading, error }: { loading: boolean; error: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--poster-muted-bg)]">
        <Mountain className="text-[var(--poster-fg-muted)] size-5" />
      </div>
      <div className="space-y-1">
        <p
          className="text-base font-semibold"
          style={{ fontFamily: "var(--poster-heading-font)" }}
        >
          Tu poster aparecerá aquí
        </p>
        <p
          className="max-w-xs text-xs text-[var(--poster-fg-muted)]"
          style={{ fontFamily: "var(--poster-body-font)" }}
        >
          Pega una URL o ID de actividad pública de Strava en el panel derecho para empezar.
        </p>
      </div>
      {loading && (
        <p
          className="text-xs text-[var(--poster-fg-muted)]"
          style={{ fontFamily: "var(--poster-body-font)" }}
        >
          Cargando actividad…
        </p>
      )}
      {error && (
        <p className="max-w-xs text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}