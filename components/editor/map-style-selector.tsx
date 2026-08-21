"use client";

import { Label } from "@/components/ui/label";
import { usePoster, type MapStyle } from "@/components/poster-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: MapStyle; label: string }[] = [
  { value: "default", label: "Carto" },
  { value: "openstreetmap", label: "OSM" },
  { value: "openstreetmap3d", label: "OSM 3D" },
  { value: "satellite", label: "Satélite" },
];

export function MapStyleSelector({ slot }: { slot: number }) {
  const { slotConfigs, setSlotConfig } = usePoster();
  const config = slotConfigs[slot];

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium">Estilo del mapa</Label>
      <div className="grid grid-cols-3 gap-1.5">
        {OPTIONS.map((option) => {
          const isSelected = config.mapStyle === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSlotConfig(slot, { mapStyle: option.value })}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs transition-colors",
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
    </div>
  );
}