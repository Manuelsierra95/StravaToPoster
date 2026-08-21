"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { usePoster } from "@/components/poster-provider";

export function UrlInput({
  slot,
  onSubmitted,
}: {
  slot: number;
  onSubmitted?: () => void;
}) {
  const { loadActivity } = usePoster();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) {
          void loadActivity(value, slot);
          setValue("");
          onSubmitted?.();
        }
      }}
      className="flex gap-1.5"
    >
      <Input
        type="text"
        placeholder="https://www.strava.com/activities/123"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-7 text-xs"
      />
    </form>
  );
}
