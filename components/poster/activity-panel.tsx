"use client";

import { useLayoutEffect, useRef } from "react";

import { usePoster, FONT_BY_ID } from "@/components/poster-provider";
import { reportHeight, useMaxHeight } from "@/components/poster/height-sync";
import { formatActivityDate, formatActivityType } from "@/lib/format";
import { hexToRgba } from "@/lib/poster-color";
import { cn } from "@/lib/utils";
import type { ScrapedActivity } from "@/lib/strava/types";
import { RouteMap } from "./route-map";
import { MetricsGrid } from "./metrics-grid";
import { ElevationChart } from "./elevation-chart";
import type { SlotConfig } from "@/components/poster-provider";

type ChartHeightMode = "compact" | "tall";

const TITLE_NS = "title";
const METRICS_NS = "metrics";

export function ActivityPanel({
  activity,
  slot,
  slotConfig,
  chartHeightMode = "tall",
}: {
  activity: ScrapedActivity;
  slot: number;
  slotConfig: SlotConfig;
  chartHeightMode?: ChartHeightMode;
}) {
  const chartHeight = chartHeightMode === "compact" ? 60 : 84;
  const maxMetricsHeight = useMaxHeight(METRICS_NS);
  const metricsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = metricsRef.current;
    if (!el) return;
    reportHeight(METRICS_NS, slot, el.offsetHeight);
    const observer = new ResizeObserver(() => {
      reportHeight(METRICS_NS, slot, el.offsetHeight);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      reportHeight(METRICS_NS, slot, null);
    };
  }, [slot, activity.id, slotConfig.hiddenMetrics, slotConfig.metricOrder]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b">
        <Header activity={activity} slot={slot} />
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <RouteMap activity={activity} slotConfig={slotConfig} />
      </div>

      {activity.elevationPoints && activity.elevationPoints.length > 1 && (
        <div
          className="shrink-0 border-t px-4 pt-3"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--poster-fg) 3%, transparent)",
          }}
        >
          <ElevationChart
            points={activity.elevationPoints}
            color={slotConfig.elevationChartColor}
            height={chartHeight}
          />
        </div>
      )}

      <footer
        ref={metricsRef}
        className="shrink-0 border-t"
        style={{ minHeight: maxMetricsHeight || undefined }}
      >
        <MetricsGrid activity={activity} slotConfig={slotConfig} />
      </footer>
    </div>
  );
}

function Header({ activity, slot }: { activity: ScrapedActivity; slot: number }) {
  const { config } = usePoster();
  const headingFont = FONT_BY_ID[config.headingFont].cssVar;
  const bodyFont = FONT_BY_ID[config.bodyFont].cssVar;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const maxTitleHeight = useMaxHeight(TITLE_NS);

  useLayoutEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    reportHeight(TITLE_NS, slot, el.offsetHeight);
    const observer = new ResizeObserver(() => {
      reportHeight(TITLE_NS, slot, el.offsetHeight);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      reportHeight(TITLE_NS, slot, null);
    };
  }, [slot, activity.name]);

  return (
    <div className={cn("space-y-1 p-4")}>
      <p
        className="text-[0.65rem] font-medium tracking-[0.2em] text-[var(--poster-fg-muted)] uppercase"
        style={{ fontFamily: bodyFont }}
      >
        {formatActivityType(activity.type)}
      </p>
      <h2
        ref={headingRef}
        className="text-xl font-bold leading-tight"
        style={{
          fontFamily: headingFont,
          minHeight: maxTitleHeight || undefined,
        }}
      >
        {activity.name}
      </h2>
      <p
        className="text-xs text-[var(--poster-fg-muted)]"
        style={{ fontFamily: bodyFont }}
      >
        {formatActivityDate(activity.startDateLocal)}
        {activity.athleteFirstName && (
          <>
            {" · "}
            {activity.athleteFirstName}
            {activity.athleteLastName ? ` ${activity.athleteLastName}` : ""}
          </>
        )}
      </p>
    </div>
  );
}

export function ActivityPanelEmpty({ orientation }: { orientation: "portrait" | "landscape" }) {
  void orientation;
  return (
    <div className="flex flex-1 items-center justify-center text-[0.7rem] text-[var(--poster-fg-muted)]">
      Sin actividad
    </div>
  );
}

export { hexToRgba };
