"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatActivityType } from "@/lib/format";
import { usePoster } from "@/components/poster-provider";
import { ActivityListItem } from "./activity-list-item";
import { ActivitySearch } from "./activity-search";
import {
  ActivityTypeFilter,
  type TypeFilterOption,
  type TypeFilterValue,
} from "./activity-type-filter";
import type { ActivitySummary } from "@/lib/strava/types";

export function ActivityList({
  slot,
  onActivitySelected,
}: {
  slot: number;
  onActivitySelected?: () => void;
}) {
  const {
    activities,
    loadingBySlot,
    auth,
    catalog,
    catalogPage,
    catalogHasMore,
    catalogState,
    catalogError,
    loadActivity,
    fetchCatalog,
  } = usePoster();
  const activity = activities[slot] ?? null;
  const loading = Boolean(loadingBySlot[slot]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");

  const typeOptions = useMemo<TypeFilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const item of catalog) {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    return [
      { value: "all", label: "Todos" },
      ...sorted.map(([type]) => ({
        value: type,
        label: formatActivityType(type),
      })),
    ];
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [catalog, search, typeFilter]);

  if (!auth.checked) {
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 text-[0.7rem]">
        <Loader2 className="size-3 animate-spin" />
        Comprobando…
      </div>
    );
  }

  if (!auth.connected) {
    return (
      <p className="text-muted-foreground text-[0.7rem]">
        Conecta Strava para ver tus actividades recientes.
      </p>
    );
  }

  const handleSelect = (selected: ActivitySummary) => {
    onActivitySelected?.();
    void loadActivity(selected.id, slot);
  };

  return (
    <div className="flex flex-col gap-2">
      <ActivitySearch value={search} onChange={setSearch} />
      <ActivityTypeFilter
        options={typeOptions}
        value={typeFilter}
        onChange={setTypeFilter}
      />

      <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
        {catalogState === "loading" && (
          <>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-muted h-12 animate-pulse rounded-md border border-border"
              />
            ))}
          </>
        )}

        {catalogState !== "loading" && filtered.length === 0 && (
          <p className="text-muted-foreground px-1 py-3 text-center text-[0.7rem]">
            {catalog.length === 0
              ? "No tienes actividades recientes."
              : "Sin coincidencias con los filtros."}
          </p>
        )}

        {catalogState !== "loading" &&
          filtered.map((item) => (
            <ActivityListItem
              key={item.id}
              activity={item}
              selected={activity?.id === item.id}
              loading={loading && activity?.id === item.id}
              onSelect={handleSelect}
            />
          ))}

        {catalogState === "error" && (
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[0.7rem] text-destructive">
              {catalogError ?? "Error al cargar"}
            </p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => void fetchCatalog(1, "initial")}
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {catalogState !== "loading" && catalogHasMore && (
        <Button
          variant="outline"
          size="xs"
          disabled={catalogState === "loadingMore"}
          onClick={() => void fetchCatalog(catalogPage + 1, "more")}
          className={cn(catalogState === "loadingMore" && "opacity-60")}
        >
          {catalogState === "loadingMore" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ChevronDown className="size-3" />
          )}
          Cargar más
        </Button>
      )}
    </div>
  );
}
