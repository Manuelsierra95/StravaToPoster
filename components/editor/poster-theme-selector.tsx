"use client";

import { Sparkles } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  useEffectiveTextColor,
  usePoster,
} from "@/components/poster-provider";
import { getTheme, THEME_ORDER, type ThemeId } from "@/lib/poster-themes";
import { cn } from "@/lib/utils";
import { hexToRgba, relativeLuminance } from "@/lib/poster-color";

const TEXT_PRESETS = [
  { color: "#ffffff", label: "Blanco" },
  { color: "#000000", label: "Negro" },
  { color: "#0f172a", label: "Noche" },
  { color: "#f5f1e8", label: "Crema" },
];

function isLight(hex: string): boolean {
  return relativeLuminance(hex) > 0.5;
}

function ThemeSwatch({
  id,
  selected,
  onSelect,
}: {
  id: ThemeId;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = getTheme(id);
  const light = isLight(theme.poster.background);
  const isSatellite = theme.id === "satellite";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={theme.label}
      title={theme.label}
      className={cn(
        "group relative flex aspect-[5/4] flex-col items-stretch overflow-hidden rounded-md border-2 transition-transform hover:scale-[1.03]",
        selected ? "border-foreground" : "border-transparent",
      )}
      style={{ backgroundColor: theme.poster.background }}
    >
      {/* Mini map preview */}
      <div className="relative flex-1 overflow-hidden">
        {isSatellite ? (
          <SatellitePreview />
        ) : (
          <>
            <div
              className="absolute inset-x-2 top-2 h-2 rounded-sm"
              style={{ backgroundColor: theme.map.vegetation }}
            />
            <div
              className="absolute inset-x-3 top-5 h-1.5 rounded-sm"
              style={{ backgroundColor: theme.map.water }}
            />
            <div
              className="absolute inset-x-4 bottom-3 h-1 rounded-full"
              style={{ backgroundColor: theme.map.roads?.minor ?? "#cccccc" }}
            />
            <div
              className="absolute inset-x-4 bottom-3 h-0.5 rounded-full"
              style={{ backgroundColor: theme.map.boundaries ?? "#999999" }}
            />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 40 30"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M 2 24 Q 12 8 22 16 T 38 6"
                fill="none"
                stroke={theme.route.default}
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </div>
      {/* Footer */}
      <div
        className="flex items-center justify-between px-1.5 py-1 text-[0.65rem] font-medium"
        style={{ color: theme.poster.text }}
      >
        <span>{theme.label}</span>
        <span
          className={cn(
            "rounded-sm px-1 text-[0.55rem] tracking-wider uppercase",
          )}
          style={{ backgroundColor: hexToRgba(theme.poster.text, 0.1) }}
        >
          {light ? "claro" : "oscuro"}
        </span>
      </div>
      {selected && (
        <span
          className={cn(
            "absolute top-1 right-1 size-2 rounded-full",
            light ? "bg-foreground/70" : "bg-white/80",
          )}
        />
      )}
    </button>
  );
}

/**
 * Mini preview for the satellite theme. Simulates the look of satellite
 * imagery: muted green/brown patches suggesting terrain and a bright route
 * line on top.
 */
function SatellitePreview() {
  return (
    <>
      <div
        className="absolute inset-x-1 top-1 bottom-1 rounded-sm"
        style={{
          background:
            "linear-gradient(135deg, #2d4a2b 0%, #3d5a3a 30%, #6b7d4f 50%, #5a6b3e 70%, #4a5a32 100%)",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 40 30"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M 2 24 Q 12 8 22 16 T 38 6"
          fill="none"
          stroke="#fc4c02"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}

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

export function PosterThemeSelector() {
  const {
    config,
    setTheme,
    setTextColor,
    resetTextColor,
  } = usePoster();
  const effectiveTextColor = useEffectiveTextColor();
  const themeDefault = getTheme(config.theme).poster.text;
  const isTextOverridden =
    config.textColorOverride !== null &&
    config.textColorOverride !== themeDefault;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium">Estilo</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {THEME_ORDER.map((id) => (
            <ThemeSwatch
              key={id}
              id={id}
              selected={config.theme === id}
              onSelect={() => setTheme(id)}
            />
          ))}
        </div>
        <p className="text-[0.65rem] text-muted-foreground">
          Cambia el fondo del poster y la estética del mapa. Los colores de
          texto y recorrido personalizados se mantienen.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Color del texto</Label>
          {isTextOverridden && (
            <button
              type="button"
              onClick={resetTextColor}
              className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[0.7rem] text-muted-foreground transition-colors hover:bg-muted"
              title={`Restablecer al color del tema (${themeDefault.toUpperCase()})`}
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
              selected={effectiveTextColor.toLowerCase() === preset.color}
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
            value={effectiveTextColor}
            onChange={(event) => setTextColor(event.target.value)}
            className="h-6 w-12 cursor-pointer rounded border bg-transparent"
          />
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {effectiveTextColor.toUpperCase()}
          </span>
        </div>
        {!isTextOverridden && (
          <p className="text-[0.65rem] text-muted-foreground">
            Usando el color por defecto del tema ({themeDefault.toUpperCase()}).
          </p>
        )}
      </div>
    </div>
  );
}
