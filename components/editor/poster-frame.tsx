"use client";

import { Label } from "@/components/ui/label";
import { usePoster, FRAME_OPTIONS, type FrameId } from "@/components/poster-provider";
import { cn } from "@/lib/utils";

export function PosterFrame() {
  const { config, setConfig } = usePoster();

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium">Marco</Label>
      <div className="grid grid-cols-3 gap-1.5">
        {FRAME_OPTIONS.map((option) => {
          const isSelected = config.frame === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setConfig({ frame: option.id as FrameId })}
              className={cn(
                "flex flex-col items-stretch overflow-hidden rounded-md border transition-colors",
                isSelected
                  ? "border-foreground ring-1 ring-foreground/40"
                  : "border-border bg-card hover:bg-muted",
              )}
              aria-pressed={isSelected}
            >
              <FrameSwatch option={option} />
              <span className="px-1.5 py-1 text-center text-[0.65rem] font-medium">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FrameSwatch({
  option,
}: {
  option: (typeof FRAME_OPTIONS)[number];
}) {
  const outerStyle =
    option.id === "wood-light"
      ? { background: option.outer }
      : { backgroundColor: option.outer };

  return (
    <div
      className="relative h-14 w-full p-1.5"
      style={outerStyle}
      aria-hidden
    >
      <div
        className="h-full w-full"
        style={{ backgroundColor: "#ffffff" }}
      />
    </div>
  );
}
