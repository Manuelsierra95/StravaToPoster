"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePoster } from "@/components/poster-provider";

export function MapLabelsControl({ slot }: { slot: number }) {
  const { slotConfigs, setSlotConfig } = usePoster();
  const config = slotConfigs[slot];

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`map-labels-${slot}`}
        checked={config.showLabels}
        onCheckedChange={(checked) =>
          setSlotConfig(slot, { showLabels: checked === true })
        }
      />
      <Label htmlFor={`map-labels-${slot}`} className="cursor-pointer text-xs font-medium">
        Mostrar nombres (calles, pueblos, ciudades)
      </Label>
    </div>
  );
}