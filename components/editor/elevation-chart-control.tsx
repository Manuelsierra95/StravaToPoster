"use client";

import { Label } from "@/components/ui/label";
import { usePoster } from "@/components/poster-provider";
import { cn } from "@/lib/utils";

const PRESETS = [
  { color: "#fc4c02", label: "Strava" },
  { color: "#3b82f6", label: "Azul" },
  { color: "#ef4444", label: "Rojo" },
  { color: "#10b981", label: "Verde" },
  { color: "#a855f7", label: "Violeta" },
  { color: "#f59e0b", label: "Ámbar" },
  { color: "#111827", label: "Negro" },
  { color: "#f4f4f5", label: "Blanco" },
];

export function ElevationChartControl({ slot }: { slot: number }) {
  const { slotConfigs, setSlotConfig } = usePoster();
  const config = slotConfigs[slot];

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium">Color del gráfico</Label>
      <div className="grid grid-cols-8 gap-1.5">
        {PRESETS.map((preset) => {
          const isSelected =
            config.elevationChartColor.toLowerCase() === preset.color;
          return (
            <button
              key={preset.color}
              type="button"
              onClick={() =>
                setSlotConfig(slot, { elevationChartColor: preset.color })
              }
              className={cn(
                "relative aspect-square rounded-md border-2 transition-transform hover:scale-110",
                isSelected ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: preset.color }}
              aria-label={preset.label}
              title={preset.label}
            >
              <span
                className={cn(
                  "absolute inset-0 m-auto size-2 rounded-full",
                  preset.color === "#f4f4f5" || preset.color === "#f59e0b"
                    ? "bg-foreground/50"
                    : "bg-white/70",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Label
          htmlFor={`elevation-chart-color-custom-${slot}`}
          className="text-[0.7rem] text-muted-foreground"
        >
          Personalizado
        </Label>
        <input
          id={`elevation-chart-color-custom-${slot}`}
          type="color"
          value={config.elevationChartColor}
          onChange={(event) =>
            setSlotConfig(slot, { elevationChartColor: event.target.value })
          }
          className="h-6 w-12 cursor-pointer rounded border bg-transparent"
        />
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          {config.elevationChartColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
}