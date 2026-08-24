"use client";

import { type SlotConfig } from "@/components/poster-provider";
import { METRICS, isPaceActivity, type MetricDefinition, type MetricId, type ScrapedActivity } from "@/lib/strava/types";
import { formatMetric } from "@/lib/format";
import { MetricCard } from "./metric-card";

function getMetricValue(id: MetricId, activity: ScrapedActivity) {
  switch (id) {
    case "distance":
      return activity.distance;
    case "moving_time":
      return activity.movingTime;
    case "elevation":
      return activity.totalElevationGain;
    case "elev_high":
      return activity.elevHigh;
    case "elev_low":
      return activity.elevLow;
    case "avg_speed":
      return activity.averageSpeed;
    case "max_speed":
      return activity.maxSpeed;
    case "avg_power":
      return activity.averageWatts;
    case "max_power":
      return activity.maxWatts;
    case "avg_hr":
      return activity.averageHeartrate;
    case "max_hr":
      return activity.maxHeartrate;
    case "avg_cadence":
      return activity.averageCadence;
    case "calories":
      return activity.calories;
  }
}

function isAvailable(
  metric: MetricDefinition,
  activity: ScrapedActivity,
): boolean {
  if (metric.shownIf === "hasPower") return activity.hasPower;
  if (metric.shownIf === "hasHeartrate") return activity.hasHeartrate;
  if (metric.shownIf === "hasCadence") {
    return activity.averageCadence !== null && activity.averageCadence > 0;
  }
  if (metric.shownIf === "hasElevRange") {
    return activity.elevHigh !== null || activity.elevLow !== null;
  }
  return true;
}

export function MetricsGrid({
  activity,
  slotConfig,
}: {
  activity: ScrapedActivity;
  slotConfig: SlotConfig;
}) {
  const usePace = isPaceActivity(activity.type);

  const ordered = slotConfig.metricOrder
    .map((id) => METRICS.find((metric) => metric.id === id))
    .filter((metric): metric is MetricDefinition => Boolean(metric));

  const visible = ordered.filter((metric) => {
    if (slotConfig.hiddenMetrics.includes(metric.id)) return false;
    return isAvailable(metric, activity);
  });

  return (
    <div className="grid grid-cols-5 gap-x-1 gap-y-3 px-3 py-3">
      {visible.map((metric) => {
        const raw = getMetricValue(metric.id, activity);
        const format = metric.format === "speed" && usePace ? "pace" : metric.format;
        const value = formatMetric(format, raw);
        return <MetricCard key={metric.id} label={metric.label} value={value} />;
      })}
    </div>
  );
}