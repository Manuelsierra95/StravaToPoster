"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;

const buckets = new Map<string, Map<number, number>>();
const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, number>();

function getOrCreate<K, V>(map: Map<K, V>, key: K, factory: () => V): V {
  const existing = map.get(key);
  if (existing !== undefined) return existing;
  const created = factory();
  map.set(key, created);
  return created;
}

function recompute(namespace: string) {
  const heights = buckets.get(namespace);
  let max = 0;
  if (heights) {
    for (const h of heights.values()) {
      if (h > max) max = h;
    }
  }
  cache.set(namespace, max);
}

export function reportHeight(
  namespace: string,
  id: number,
  height: number | null,
) {
  const heights = getOrCreate(buckets, namespace, () => new Map<number, number>());
  let changed = false;
  if (height === null) {
    if (heights.delete(id)) changed = true;
  } else if (heights.get(id) !== height) {
    heights.set(id, height);
    changed = true;
  }
  // Always recompute on removal. When a sibling slot is unmounted its reported
  // height can equal the new max, so `changed` stays false even though the
  // surviving slot's minHeight constraint should re-evaluate.
  if (height === null || changed) {
    recompute(namespace);
    listeners.get(namespace)?.forEach((cb) => cb());
  }
}

export function useMaxHeight(namespace: string): number {
  return useSyncExternalStore(
    (cb) => {
      getOrCreate(listeners, namespace, () => new Set<Listener>()).add(cb);
      return () => {
        listeners.get(namespace)?.delete(cb);
      };
    },
    () => cache.get(namespace) ?? 0,
    () => 0,
  );
}
