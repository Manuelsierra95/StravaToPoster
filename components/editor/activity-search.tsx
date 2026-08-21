"use client";

import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ActivitySearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="Buscar por nombre…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("h-7 pr-7 text-xs")}
      />
      {value && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 text-xs"
        >
          ×
        </button>
      )}
      {!value && (
        <Loader2 className="text-muted-foreground/0 size-3" aria-hidden />
      )}
    </div>
  );
}
