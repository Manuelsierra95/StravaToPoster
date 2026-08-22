"use client";

import { Sparkles } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  useEffectiveRouteColor,
  usePoster,
} from "@/components/poster-provider";
import { getTheme } from "@/lib/poster-themes";
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

export function RouteColorPicker({ slot }: { slot: number }) {
  const { slotConfigs, config, setRouteColor, resetRouteColor } = usePoster();
  const effectiveColor = useEffectiveRouteColor(slot);
  const override = slotConfigs[slot].routeColorOverride;
  const themeDefault = getTheme(config.theme).route.default;
  const isOverridden = override !== null && override !== themeDefault;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Color del recorrido</Label>
        {isOverridden && (
          <button
            type="button"
            onClick={() => resetRouteColor(slot)}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[0.7rem] text-muted-foreground transition-colors hover:bg-muted"
            title={`Restablecer al color del tema (${themeDefault.toUpperCase()})`}
          >
            <Sparkles className="size-3" />
            Auto
          </button>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {PRESETS.map((preset) => {
          const isSelected =
            effectiveColor.toLowerCase() === preset.color.toLowerCase();
          return (
            <button
              key={preset.color}
              type="button"
              onClick={() => setRouteColor(slot, preset.color)}
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
          htmlFor={`route-color-custom-${slot}`}
          className="text-[0.7rem] text-muted-foreground"
        >
          Personalizado
        </Label>
        <input
          id={`route-color-custom-${slot}`}
          type="color"
          value={effectiveColor}
          onChange={(event) => setRouteColor(slot, event.target.value)}
          className="h-6 w-12 cursor-pointer rounded border bg-transparent"
        />
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          {effectiveColor.toUpperCase()}
        </span>
      </div>
      {!isOverridden && (
        <p className="text-[0.65rem] text-muted-foreground">
          Usando el color por defecto del tema ({themeDefault.toUpperCase()}).
        </p>
      )}
    </div>
  );
}
