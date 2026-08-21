"use client";

import { Sparkles } from "lucide-react";

import { Label } from "@/components/ui/label";
import { usePoster } from "@/components/poster-provider";
import { cn } from "@/lib/utils";

const BACKGROUND_PRESETS = [
  { color: "#ffffff", label: "Blanco" },
  { color: "#f5f1e8", label: "Crema" },
  { color: "#0f172a", label: "Noche" },
  { color: "#1f2937", label: "Carbón" },
  { color: "#0c4a6e", label: "Marino" },
  { color: "#14532d", label: "Bosque" },
  { color: "#fef3c7", label: "Arena" },
  { color: "#fce7f3", label: "Rosa" },
];

const TEXT_PRESETS = [
  { color: "#ffffff", label: "Blanco" },
  { color: "#000000", label: "Negro" },
  { color: "#0f172a", label: "Noche" },
  { color: "#f5f1e8", label: "Crema" },
];

function PresetSwatch({
  color,
  selected,
  onSelect,
  ariaLabel,
}: {
  color: string;
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "relative aspect-square rounded-md border-2 transition-transform hover:scale-110",
        selected ? "border-foreground" : "border-transparent",
      )}
      style={{ backgroundColor: color }}
    >
      <span
        className={cn(
          "absolute inset-0 m-auto size-2 rounded-full",
          isLight(color) ? "bg-foreground/60" : "bg-white/80",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

function isLight(hex: string): boolean {
  const value = hex.replace("#", "");
  if (value.length !== 6) return true;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function PosterBackground() {
  const {
    config,
    setBackgroundColor,
    setTextColor,
    resetTextColor,
  } = usePoster();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium">Fondo del poster</Label>
        <div className="grid grid-cols-8 gap-1.5">
          {BACKGROUND_PRESETS.map((preset) => (
            <PresetSwatch
              key={preset.color}
              color={preset.color}
              selected={config.backgroundColor.toLowerCase() === preset.color}
              onSelect={() => setBackgroundColor(preset.color)}
              ariaLabel={preset.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="poster-bg-custom"
            className="text-[0.7rem] text-muted-foreground"
          >
            Personalizado
          </Label>
          <input
            id="poster-bg-custom"
            type="color"
            value={config.backgroundColor}
            onChange={(event) => setBackgroundColor(event.target.value)}
            className="h-6 w-12 cursor-pointer rounded border bg-transparent"
          />
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {config.backgroundColor.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Color del texto</Label>
          {!config.textColorAuto && (
            <button
              type="button"
              onClick={resetTextColor}
              className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[0.7rem] text-muted-foreground transition-colors hover:bg-muted"
              title="Restablecer al color autodetectado"
            >
              <Sparkles className="size-3" />
              Auto
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {TEXT_PRESETS.map((preset) => (
            <PresetSwatch
              key={preset.color}
              color={preset.color}
              selected={config.textColor.toLowerCase() === preset.color}
              onSelect={() => setTextColor(preset.color)}
              ariaLabel={preset.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="poster-text-custom"
            className="text-[0.7rem] text-muted-foreground"
          >
            Personalizado
          </Label>
          <input
            id="poster-text-custom"
            type="color"
            value={config.textColor}
            onChange={(event) => setTextColor(event.target.value)}
            className="h-6 w-12 cursor-pointer rounded border bg-transparent"
          />
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {config.textColor.toUpperCase()}
          </span>
        </div>
        {!config.textColorAuto && (
          <p className="text-[0.65rem] text-muted-foreground">
            Color personalizado — usa Auto para volver al autodetectado.
          </p>
        )}
      </div>
    </div>
  );
}
