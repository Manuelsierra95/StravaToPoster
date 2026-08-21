"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { usePoster } from "@/components/poster-provider";

export function MapTiltControl({ slot }: { slot: number }) {
  const { slotConfigs, setSlotConfig } = usePoster();
  const config = slotConfigs[slot];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Inclinación</Label>
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {config.pitch}°
          </span>
        </div>
        <Slider
          value={[config.pitch]}
          min={0}
          max={60}
          step={5}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            setSlotConfig(slot, { pitch: next });
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Zoom</Label>
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {zoomPercent(config.zoom)}%
          </span>
        </div>
        <Slider
          value={[zoomSliderValue(config.zoom)]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            setSlotConfig(slot, { zoom: sliderToZoom(next) });
          }}
        />
      </div>
    </div>
  );
}

const ZOOM_OFFSET_MIN = -2;
const ZOOM_OFFSET_MAX = 2;

function zoomSliderValue(offset: number): number {
  const clamped = Math.max(ZOOM_OFFSET_MIN, Math.min(ZOOM_OFFSET_MAX, offset));
  return Math.round(((clamped - ZOOM_OFFSET_MIN) / (ZOOM_OFFSET_MAX - ZOOM_OFFSET_MIN)) * 100);
}

function sliderToZoom(value: number): number {
  const ratio = value / 100;
  return ZOOM_OFFSET_MIN + ratio * (ZOOM_OFFSET_MAX - ZOOM_OFFSET_MIN);
}

function zoomPercent(offset: number): number {
  return zoomSliderValue(offset);
}