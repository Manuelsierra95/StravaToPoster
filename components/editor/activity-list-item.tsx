"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatActivityType } from "@/lib/format";
import type { ActivitySummary } from "@/lib/strava/types";

export function ActivityListItem({
  activity,
  selected,
  loading,
  onSelect,
}: {
  activity: ActivitySummary;
  selected?: boolean;
  loading?: boolean;
  onSelect: (activity: ActivitySummary) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(activity)}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:bg-muted",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{activity.name}</p>
        <p
          className={cn(
            "text-[0.65rem] tracking-wider uppercase",
            selected ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {formatActivityType(activity.type)}
        </p>
      </div>
      {loading && (
        <Loader2
          className={cn(
            "size-3 animate-spin",
            selected ? "text-background" : "text-muted-foreground",
          )}
        />
      )}
    </button>
  );
}
