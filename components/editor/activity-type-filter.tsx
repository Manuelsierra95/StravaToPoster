"use client";

import { cn } from "@/lib/utils";

export type TypeFilterValue = "all" | string;

export interface TypeFilterOption {
  value: TypeFilterValue;
  label: string;
}

export function ActivityTypeFilter({
  options,
  value,
  onChange,
}: {
  options: TypeFilterOption[];
  value: TypeFilterValue;
  onChange: (value: TypeFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[0.65rem] transition-colors",
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
