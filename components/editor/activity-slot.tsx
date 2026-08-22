"use client";

import { useState } from "react";
import {
  Bike,
  ChevronsUpDown,
  Footprints,
  Mountain,
  Waves,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePoster } from "@/components/poster-provider";
import { formatActivityType } from "@/lib/format";
import type { ScrapedActivity, StravaActivityType } from "@/lib/strava/types";
import { ActivityList } from "./activity-list";
import { UrlInput } from "./url-input";
import { cn } from "@/lib/utils";

const TYPE_ICON_BY_KIND: Record<"swim" | "bike" | "run" | "other", LucideIcon> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  other: Mountain,
};

function iconKindFor(type?: StravaActivityType): keyof typeof TYPE_ICON_BY_KIND {
  if (!type) return "other";
  if (type === "Swim") return "swim";
  if (
    type === "Ride" ||
    type === "MountainBikeRide" ||
    type === "GravelRide" ||
    type === "VirtualRide" ||
    type === "EMountainBikeRide" ||
    type === "Velomobile" ||
    type === "Handcycle"
  ) {
    return "bike";
  }
  if (
    type === "Run" ||
    type === "TrailRun" ||
    type === "VirtualRun" ||
    type === "Walk" ||
    type === "Hike" ||
    type === "Snowshoe" ||
    type === "RollerSki"
  ) {
    return "run";
  }
  return "other";
}

export function ActivitySlot({ slot }: { slot: number }) {
  const { activities } = usePoster();
  const [open, setOpen] = useState(false);
  const activity: ScrapedActivity | null = activities[slot] ?? null;
  const Icon = TYPE_ICON_BY_KIND[iconKindFor(activity?.type)];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        nativeButton={false}
        render={
          <div className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-left" />
        }
        aria-label={open ? "Cerrar actividad" : "Abrir actividad"}
      >
        <span className="flex min-w-0 items-center gap-2 text-xs">
          <Icon className={cn("size-3.5 shrink-0")} aria-hidden />
          <span className="truncate font-medium">
            {activity
              ? `${formatActivityType(activity.type)} · ${activity.name}`
              : "Sin actividad"}
          </span>
        </span>
        <ChevronsUpDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1.5">
        <ActivityList
          slot={slot}
          onActivitySelected={() => setOpen(false)}
        />
        <div className="space-y-1.5 pt-2">
          <p className="text-muted-foreground text-[0.7rem]">
            o pega una URL manualmente
          </p>
          <UrlInput slot={slot} onSubmitted={() => setOpen(false)} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
