"use client";

import { usePoster, FONT_OPTIONS, type FontId } from "@/components/poster-provider";
import { cn } from "@/lib/utils";

function FontPreview({ cssVar }: { cssVar: string }) {
  return (
    <span
      className="font-sans text-base font-bold leading-none"
      style={{ fontFamily: cssVar }}
    >
      Aa
    </span>
  );
}

function FontSwatch({
  id,
  selected,
  onSelect,
}: {
  id: FontId;
  selected: boolean;
  onSelect: (id: FontId) => void;
}) {
  const option = FONT_OPTIONS.find((opt) => opt.id === id);
  if (!option) return null;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      title={option.label}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:bg-muted",
      )}
    >
      <FontPreview cssVar={option.cssVar} />
      <span className="truncate">{option.label}</span>
    </button>
  );
}

export function FontPicker() {
  const { config, setConfig } = usePoster();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.7rem] font-medium text-muted-foreground">
            Titulares
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_OPTIONS.map((option) => (
            <FontSwatch
              key={option.id}
              id={option.id}
              selected={config.headingFont === option.id}
              onSelect={(id) => setConfig({ headingFont: id })}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.7rem] font-medium text-muted-foreground">
            Texto
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_OPTIONS.map((option) => (
            <FontSwatch
              key={option.id}
              id={option.id}
              selected={config.bodyFont === option.id}
              onSelect={(id) => setConfig({ bodyFont: id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
