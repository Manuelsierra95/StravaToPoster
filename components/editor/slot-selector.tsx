"use client";

import { cn } from "@/lib/utils";
import { usePoster, type ActivityCount } from "@/components/poster-provider";
import { formatActivityType } from "@/lib/format";

export function SlotSelector({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (slot: number) => void;
  className?: string;
}) {
  const { activities, config } = usePoster();
  const max: ActivityCount = config.activityCount;

  return (
    <div
      className={cn(
        "grid gap-1.5",
        max === 3 ? "grid-cols-3" : max === 2 ? "grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {Array.from({ length: max }).map((_, idx) => {
        const slot = idx;
        const activity = activities[slot] ?? null;
        const isSelected = value === slot;
        const label = activity
          ? `${slot + 1} · ${formatActivityType(activity.type)}`
          : `${slot + 1}`;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onChange(slot)}
            aria-pressed={isSelected}
            className={cn(
              "flex items-center justify-center rounded-md border px-2 py-1.5 text-xs transition-colors",
              isSelected
                ? "border-foreground/15 bg-foreground/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/70",
            )}
          >
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}