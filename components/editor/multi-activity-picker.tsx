"use client";

import { usePoster } from "@/components/poster-provider";
import { ActivityCountSelector } from "./activity-count-selector";
import { ActivitySlot } from "./activity-slot";

export function MultiActivityPicker() {
  const { config } = usePoster();
  const count = config.activityCount;

  return (
    <div className="flex flex-col gap-3">
      <ActivityCountSelector />
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <ActivitySlot key={i} slot={i} />
        ))}
      </div>
    </div>
  );
}