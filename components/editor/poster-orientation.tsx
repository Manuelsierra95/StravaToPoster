"use client";

import { RectangleHorizontal, RectangleVertical } from "lucide-react";

import { Label } from "@/components/ui/label";
import { usePoster, type Orientation } from "@/components/poster-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Orientation; label: string; icon: typeof RectangleVertical }[] = [
  { value: "portrait", label: "Vertical", icon: RectangleVertical },
  { value: "landscape", label: "Horizontal", icon: RectangleHorizontal },
];

export function PosterOrientation() {
  const { config, setConfig } = usePoster();

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium">Formato</Label>
      <div className="grid grid-cols-2 gap-1.5">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = config.orientation === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setConfig({ orientation: option.value })}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <Icon className="size-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
