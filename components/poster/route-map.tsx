"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Map, MapRoute, useMap, type MapRef } from "@/components/ui/map";

import {
  useEffectiveRouteColor,
  usePoster,
  type SlotConfig,
} from "@/components/poster-provider";
import { DEFAULT_BASE_STYLE, getTheme, type ThemeId } from "@/lib/poster-themes";
import { applyTheme, validateThemeLayers } from "./map-theme-applier";
import type { ScrapedActivity } from "@/lib/strava/types";
import { decodePolyline, getBounds, type LngLat } from "@/lib/strava-polyline";

const FALLBACK_CENTER: LngLat = [-74.006, 40.7128];
const FALLBACK_ZOOM = 12;
const FIT_PADDING = { top: 64, right: 64, bottom: 64, left: 64 };
const MAX_FIT_ZOOM = 12;
const MIN_ZOOM = 0;
const MAX_ZOOM = 20;

/**
 * Re-paints every categorized layer with the active theme. Renders as a child
 * of `<Map>` so it can use the `useMap()` context, which exposes a reliable
 * `isLoaded` flag (true only after the Map's `load` AND `style.load` events
 * have fired). Forces a repaint so paint property changes are flushed to the
 * canvas immediately.
 */
function ThemeController({ theme }: { theme: ThemeId }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const themeObj = getTheme(theme);
    applyTheme(map, themeObj);
    validateThemeLayers(map, themeObj);
    map.triggerRepaint();
  }, [map, isLoaded, theme]);

  return null;
}

export function RouteMap({
  activity,
  slot,
  slotConfig,
  wrapperRef,
}: {
  activity: ScrapedActivity;
  slot: number;
  slotConfig: SlotConfig;
  wrapperRef?: RefObject<HTMLDivElement | null>;
}) {
  const mapRef = useRef<MapRef>(null);
  const baseZoomRef = useRef<number>(FALLBACK_ZOOM);
  const { config, registerMap } = usePoster();
  const routeColor = useEffectiveRouteColor(slot);

  // Register the MapLibre instance with the provider as soon as it's exposed
  // via the forwarded ref. The Map component populates this in its commit
  // phase, so a short retry loop covers the gap between mount and ref fill.
  useEffect(() => {
    let cancelled = false;
    let unregister: (() => void) | null = null;
    let frame = 0;
    const tryRegister = () => {
      if (cancelled) return;
      const map = mapRef.current;
      if (!map) {
        frame = requestAnimationFrame(tryRegister);
        return;
      }
      unregister = registerMap(slot, map);
    };
    tryRegister();
    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      unregister?.();
    };
  }, [slot, registerMap]);

  const coordinates = useMemo(
    () => (activity ? decodePolyline(activity.summaryPolyline) : []),
    [activity],
  );

  const initialViewport = useMemo(() => {
    const bounds = getBounds(coordinates);
    if (!bounds) return { center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM };
    return {
      center: [
        (bounds.minLng + bounds.maxLng) / 2,
        (bounds.minLat + bounds.maxLat) / 2,
      ] as LngLat,
      zoom: FALLBACK_ZOOM,
    };
  }, [coordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activity) return;
    const bounds = getBounds(coordinates);
    if (!bounds) return;
    map.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: FIT_PADDING, duration: 0, maxZoom: MAX_FIT_ZOOM },
    );
    baseZoomRef.current = map.getZoom();
  }, [activity, coordinates]);

  // MapLibre's internal ResizeObserver only watches the map container itself.
  // When the parent flex layout changes (e.g. activity count 3 → 1) the
  // container's box can briefly lag behind. Re-fire a resize whenever the
  // wrapper element changes so the canvas catches up.
  useEffect(() => {
    const wrapper = wrapperRef?.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(() => {
      const map = mapRef.current;
      if (!map) return;
      map.resize();
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [wrapperRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      pitch: slotConfig.pitch,
      bearing: slotConfig.bearing,
      duration: 400,
    });
  }, [slotConfig.pitch, slotConfig.bearing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = baseZoomRef.current + slotConfig.zoom;
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target));
    map.easeTo({ zoom: clamped, duration: 200 });
  }, [slotConfig.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyLabelVisibility = () => {
      if (!map.isStyleLoaded()) return;
      const layers = map.getStyle()?.layers ?? [];
      for (const layer of layers) {
        if (layer.type === "symbol") {
          map.setLayoutProperty(
            layer.id,
            "visibility",
            slotConfig.showLabels ? "visible" : "none",
          );
        }
      }
    };

    applyLabelVisibility();
    map.on("style.load", applyLabelVisibility);
    return () => {
      map.off("style.load", applyLabelVisibility);
    };
  }, [slotConfig.showLabels]);

  const baseStyle =
    getTheme(config.theme).map.baseStyle ?? DEFAULT_BASE_STYLE;

  return (
    <Map
      ref={mapRef}
      center={initialViewport.center}
      zoom={initialViewport.zoom}
      pitch={slotConfig.pitch}
      bearing={slotConfig.bearing}
      interactive={false}
      styles={{ light: baseStyle, dark: baseStyle }}
    >
      <ThemeController theme={config.theme} />
      {coordinates.length >= 2 && (
        <MapRoute
          coordinates={coordinates}
          color={routeColor}
          width={4}
          opacity={0.95}
        />
      )}
    </Map>
  );
}
