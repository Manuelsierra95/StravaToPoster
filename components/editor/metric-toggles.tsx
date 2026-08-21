"use client";

import { GripVertical, Lock } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Draggable } from "@/components/ui/draggable";
import { Droppable } from "@/components/ui/droppable";
import { usePoster } from "@/components/poster-provider";
import { METRICS, type MetricDefinition, type ScrapedActivity } from "@/lib/strava/types";
import { cn } from "@/lib/utils";

const DRAG_TYPE = "metric";

interface DragMetricItem {
  id: string;
  type: typeof DRAG_TYPE;
  index: number;
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

export function MetricToggles({ slot }: { slot: number }) {
  const { activities, slotConfigs, setMetricVisible, reorderMetrics } = usePoster();
  const activity = activities[slot] ?? null;
  const config = slotConfigs[slot];

  const handleDrop = (
    droppedItem: DragMetricItem,
    targetIndex: number,
  ) => {
    if (droppedItem.index !== targetIndex) {
      reorderMetrics(slot, droppedItem.index, targetIndex);
    }
  };

  if (!activity) {
    return (
      <p className="text-muted-foreground text-[0.7rem]">
        Selecciona una actividad para editar sus métricas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {config.metricOrder.map((id, index) => {
        const metric = METRICS.find((m) => m.id === id);
        if (!metric) return null;
        const available = isAvailable(metric, activity);
        const visible = !config.hiddenMetrics.includes(id) && available;

        return (
          <Droppable
            key={id}
            accept={DRAG_TYPE}
            disabled={!available}
            onDrop={(item: unknown) =>
              handleDrop(item as DragMetricItem, index)
            }
            hoverClassName="ring-foreground/40 rounded-sm ring-2"
          >
            <Draggable
              item={{ id, type: DRAG_TYPE, index }}
              disabled={!available}
            >
              <div
                className={cn(
                  "flex items-center gap-2 rounded-sm px-1.5 py-1 text-xs transition-colors",
                  available ? "hover:bg-muted" : "opacity-60",
                )}
              >
                <GripVertical
                  className={cn(
                    "size-3 shrink-0 text-muted-foreground",
                    available ? "" : "opacity-50",
                  )}
                />
                <Checkbox
                  checked={visible}
                  onCheckedChange={() => setMetricVisible(slot, id, !visible)}
                  disabled={!available}
                />
                <span className="flex-1">{metric.label}</span>
                {!available && (
                  <span
                    className="flex items-center gap-1 text-[0.65rem] text-muted-foreground"
                    title="Métrica no disponible para esta actividad"
                  >
                    <Lock className="size-3" />
                  </span>
                )}
              </div>
            </Draggable>
          </Droppable>
        );
      })}
    </div>
  );
}