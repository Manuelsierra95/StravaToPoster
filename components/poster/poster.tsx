"use client";

import { Mountain } from "lucide-react";

import {
  FRAME_OPTIONS,
  FONT_BY_ID,
  useEffectiveTextColor,
  usePoster,
} from "@/components/poster-provider";
import { getTheme } from "@/lib/poster-themes";
import { hexToRgba } from "@/lib/poster-color";
import { cn } from "@/lib/utils";
import { ActivityPanel, ActivityPanelEmpty } from "./activity-panel";

export function Poster() {
  const { activities, slotConfigs, loadingBySlot, errorsBySlot, config, posterFrameRef } = usePoster();
  const effectiveTextColor = useEffectiveTextColor();
  const theme = getTheme(config.theme);
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

  const frame = FRAME_OPTIONS.find((option) => option.id === config.frame) ?? FRAME_OPTIONS[0];
  const frameOuterStyle =
    frame.id === "wood-light"
      ? { background: frame.outer }
      : { backgroundColor: frame.outer };

  const posterStyle = {
    backgroundColor: theme.poster.background,
    color: effectiveTextColor,
    "--poster-bg": theme.poster.background,
    "--poster-fg": effectiveTextColor,
    "--poster-fg-muted": hexToRgba(effectiveTextColor, 0.55),
    "--poster-muted-bg": hexToRgba(effectiveTextColor, 0.04),
    "--poster-heading-font": FONT_BY_ID[config.headingFont].cssVar,
    "--poster-body-font": FONT_BY_ID[config.bodyFont].cssVar,
  } as React.CSSProperties;

  const visibleCount = filled.length;
  const columnsOrRows = visibleCount > 0 ? visibleCount : 1;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-muted/30 p-4 lg:p-8">
      <div
        ref={posterFrameRef}
        data-poster-frame
        className="relative p-7 shadow-2xl transition-[box-shadow,background-color,background] duration-300"
        style={{
          ...frameOuterStyle,
          boxShadow: `0 30px 60px -15px rgba(0,0,0,0.5), inset 0 0 0 1px ${frame.edge}`,
        }}
      >
        <div
          data-poster-scope
          style={posterStyle}
          className={cn(
            "relative flex w-full overflow-hidden p-6 transition-colors duration-300",
            isLandscape
              ? "aspect-[4/3] max-h-[min(95vh,1100px)] max-w-[min(98vw,1500px)] min-w-[min(75vw,640px)] flex-col"
              : "aspect-[3/4] max-h-[min(98vh,1300px)] max-w-[min(98vw,900px)] min-w-[min(70vw,360px)] flex-row",
          )}
        >
          {visibleCount === 0 ? (
            <EmptyState loading={anyLoading} error={firstError} orientation={isLandscape ? "landscape" : "portrait"} />
          ) : (
            <div
              className="flex h-full w-full min-h-0 min-w-0 gap-6"
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
                    orientation={isLandscape ? "landscape" : "portrait"}
                  />
                </div>
              ))}
              {Array.from({ length: count - visibleCount }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex min-w-0 min-h-0 overflow-hidden"
                  style={{ flex: "1 1 0", flexBasis: 0 }}
                >
                  <ActivityPanelEmpty orientation={isLandscape ? "landscape" : "portrait"} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ loading, error, orientation }: { loading: boolean; error: string | null; orientation: "landscape" | "portrait" }) {
  const sizeClasses =
    orientation === "landscape"
      ? "aspect-[4/3] min-h-[min(95vh,1100px)] max-h-[min(95vh,1100px)] max-w-[min(98vw,1500px)] min-w-[min(75vw,640px)]"
      : "aspect-[3/4] min-h-[min(98vh,1300px)] max-h-[min(98vh,1300px)] max-w-[min(98vw,900px)] min-w-[min(70vw,360px)]";

  return (
    <div className={cn("flex flex-1 flex-col items-center justify-start gap-3 px-8 pt-[18%] text-center", sizeClasses)}>
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