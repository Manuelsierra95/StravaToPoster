"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

import { usePoster, FONT_BY_ID } from "@/components/poster-provider";
import { reportHeight, useMaxHeight } from "@/components/poster/height-sync";
import { formatActivityDate, formatActivityType } from "@/lib/format";
import { hexToRgba } from "@/lib/poster-color";
import type { RiderFieldId, ScrapedActivity } from "@/lib/strava/types";
import { RouteMap } from "./route-map";
import { MetricsGrid } from "./metrics-grid";
import { ElevationChart } from "./elevation-chart";
import type { SlotConfig } from "@/components/poster-provider";

type ChartHeightMode = "compact" | "tall";
type Orientation = "portrait" | "landscape";

const TITLE_NS = "title";
const METRICS_NS = "metrics";

export function ActivityPanel({
  activity,
  slot,
  slotConfig,
  chartHeightMode = "tall",
  orientation = "portrait",
}: {
  activity: ScrapedActivity;
  slot: number;
  slotConfig: SlotConfig;
  chartHeightMode?: ChartHeightMode;
  orientation?: Orientation;
}) {
  const hasElevation =
    Boolean(activity.elevationPoints) &&
    (activity.elevationPoints?.length ?? 0) > 1;
  const chartHeight = chartHeightMode === "compact" ? 72 : 100;
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

  if (orientation === "landscape") {
    return (
      <LandscapeActivityPanel
        activity={activity}
        slot={slot}
        slotConfig={slotConfig}
        chartHeight={chartHeight}
        metricsRef={metricsRef}
        hasElevation={hasElevation}
        maxMetricsHeight={maxMetricsHeight}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0">
        <Header activity={activity} slot={slot} slotConfig={slotConfig} />
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <RouteMap activity={activity} slot={slot} slotConfig={slotConfig} />
      </div>

      {hasElevation && activity.elevationPoints && (
        <div
          className="shrink-0 px-4 pt-3"
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
        className="shrink-0"
        style={{ minHeight: maxMetricsHeight || undefined }}
      >
        <MetricsGrid activity={activity} slotConfig={slotConfig} />
      </footer>
    </div>
  );
}

function LandscapeActivityPanel({
  activity,
  slot,
  slotConfig,
  chartHeight,
  metricsRef,
  hasElevation,
  maxMetricsHeight,
}: {
  activity: ScrapedActivity;
  slot: number;
  slotConfig: SlotConfig;
  chartHeight: number;
  metricsRef: RefObject<HTMLDivElement | null>;
  hasElevation: boolean;
  maxMetricsHeight: number;
}) {
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

  const athleteFullName = activity.athleteFirstName
    ? `${activity.athleteFirstName}${
        activity.athleteLastName ? ` ${activity.athleteLastName}` : ""
      }`
    : null;

  const showAthleteSection =
    Boolean(athleteFullName) || slotConfig.riderSectionEnabled;

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 overflow-hidden">
      <div
        className="flex min-w-0 min-h-0 flex-col"
        style={{ flexBasis: "60%", flexGrow: 0, flexShrink: 0 }}
      >
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <RouteMap activity={activity} slot={slot} slotConfig={slotConfig} />
        </div>

        {hasElevation && activity.elevationPoints && (
          <div
            className="min-h-0 overflow-hidden px-4 pt-3"
            style={{
              height: `${chartHeight + 13}px`,
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
      </div>

      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="flex shrink-0 flex-col justify-start gap-1 overflow-hidden p-4"
          style={{ fontFamily: bodyFont }}
        >
          <p className="text-[0.65rem] font-medium tracking-[0.2em] text-[var(--poster-fg-muted)] uppercase">
            {formatActivityType(activity.type)}
          </p>
          <h2
            ref={headingRef}
            className="break-words text-xl font-bold leading-tight"
            style={{
              fontFamily: headingFont,
              minHeight: maxTitleHeight || undefined,
            }}
          >
            {activity.name}
          </h2>
          <p className="text-xs text-[var(--poster-fg-muted)]">
            {formatActivityDate(activity.startDateLocal)}
          </p>
        </div>

        {showAthleteSection && (
          <div
            className="flex shrink-0 flex-col justify-start gap-1.5 overflow-hidden p-4"
            style={{ fontFamily: bodyFont }}
          >
            {athleteFullName && (
              <p className="text-xs text-[var(--poster-fg-muted)]">
                {athleteFullName}
              </p>
            )}
            {slotConfig.riderSectionEnabled && (
              <RiderInfo
                order={slotConfig.riderFieldOrder}
                hidden={slotConfig.hiddenRiderFields}
                rider={slotConfig.rider}
                bodyFont={bodyFont}
                align="start"
              />
            )}
          </div>
        )}

        <div
          ref={metricsRef}
          className="flex shrink-0 overflow-hidden"
          style={{
            minHeight: maxMetricsHeight || undefined,
          }}
        >
          <MetricsGrid activity={activity} slotConfig={slotConfig} />
        </div>

        <div className="flex-1" aria-hidden />
      </div>
    </div>
  );
}

function Header({
  activity,
  slot,
  slotConfig,
}: {
  activity: ScrapedActivity;
  slot: number;
  slotConfig: SlotConfig;
}) {
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

  const riderVisible = slotConfig.riderSectionEnabled;

  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className="text-[0.65rem] font-medium tracking-[0.2em] text-[var(--poster-fg-muted)] uppercase"
          style={{ fontFamily: bodyFont }}
        >
          {formatActivityType(activity.type)}
        </p>
        <h2
          ref={headingRef}
          className="break-words text-xl font-bold leading-tight"
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
      {riderVisible && (
        <RiderInfo
          order={slotConfig.riderFieldOrder}
          hidden={slotConfig.hiddenRiderFields}
          rider={slotConfig.rider}
          bodyFont={bodyFont}
        />
      )}
    </div>
  );
}

function RiderInfo({
  order,
  hidden,
  rider,
  bodyFont,
  align = "end",
}: {
  order: RiderFieldId[];
  hidden: RiderFieldId[];
  rider: { name: string; club: string; bib: string };
  bodyFont: string;
  align?: "start" | "end";
}) {
  const visible = order.filter((id) => !hidden.includes(id));
  const items = visible
    .map((id) => {
      const value = rider[id].trim();
      if (!value) return null;
      return { id, value };
    })
    .filter((item): item is { id: RiderFieldId; value: string } => item !== null);

  if (items.length === 0) return null;

  const alignmentClass =
    align === "end" ? "items-end text-right" : "items-start text-left";

  return (
    <div
      className={`flex shrink-0 flex-col gap-1 ${alignmentClass}`}
      style={{ fontFamily: bodyFont }}
    >
      {items.map((item) => {
        if (item.id === "name") {
          return (
            <span
              key={item.id}
              className="text-sm font-semibold text-[var(--poster-fg)]"
              style={{ fontFamily: bodyFont }}
            >
              {item.value}
            </span>
          );
        }
        if (item.id === "bib") {
          return (
            <span
              key={item.id}
              className="text-xs font-semibold tabular-nums text-[var(--poster-fg-muted)]"
              style={{ fontFamily: bodyFont }}
            >
              #{item.value}
            </span>
          );
        }
        return (
          <span
            key={item.id}
            className="text-xs text-[var(--poster-fg-muted)]"
            style={{ fontFamily: bodyFont }}
          >
            {item.value}
          </span>
        );
      })}
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
