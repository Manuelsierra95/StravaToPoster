"use client";

import { cn } from "@/lib/utils";
import { usePoster, type ActivityCount } from "@/components/poster-provider";

const OPTIONS: { value: ActivityCount; label: string }[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
];

export function ActivityCountSelector() {
  const { config, setActivityCount } = usePoster();
  const value = config.activityCount;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setActivityCount(option.value)}
            aria-pressed={isSelected}
            className={cn(
              "flex items-center justify-center rounded-md border px-2 py-1.5 text-xs transition-colors",
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}