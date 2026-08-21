"use client";

import { useEffect, useMemo, useRef } from "react";
import type { StyleSpecification } from "maplibre-gl";
import { Map, MapRoute, type MapRef } from "@/components/ui/map";

import { type MapStyle, type SlotConfig } from "@/components/poster-provider";
import type { ScrapedActivity } from "@/lib/strava/types";
import { decodePolyline, getBounds, type LngLat } from "@/lib/strava-polyline";

const STYLE_URLS: Partial<Record<MapStyle, string>> = {
  openstreetmap: "https://tiles.openfreemap.org/styles/bright",
  openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
};

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Tiles © Esri",
    },
  },
  layers: [
    {
      id: "esri-satellite",
      type: "raster",
      source: "esri-satellite",
    },
  ],
};

const STYLE_BY_MODE: Partial<Record<MapStyle, StyleSpecification | string>> = {
  ...STYLE_URLS,
  satellite: SATELLITE_STYLE,
};

const FALLBACK_CENTER: LngLat = [-74.006, 40.7128];
const FALLBACK_ZOOM = 12;
const FIT_PADDING = { top: 64, right: 64, bottom: 64, left: 64 };
const MAX_FIT_ZOOM = 12;
const MIN_ZOOM = 0;
const MAX_ZOOM = 20;

export function RouteMap({
  activity,
  slotConfig,
}: {
  activity: ScrapedActivity;
  slotConfig: SlotConfig;
}) {
  const mapRef = useRef<MapRef>(null);
  const baseZoomRef = useRef<number>(FALLBACK_ZOOM);

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

  const selectedStyle = STYLE_BY_MODE[slotConfig.mapStyle];

  return (
    <Map
      ref={mapRef}
      center={initialViewport.center}
      zoom={initialViewport.zoom}
      pitch={slotConfig.pitch}
      bearing={slotConfig.bearing}
      interactive={false}
      styles={
        selectedStyle
          ? { light: selectedStyle, dark: selectedStyle }
          : undefined
      }
    >
      {coordinates.length >= 2 && (
        <MapRoute
          coordinates={coordinates}
          color={slotConfig.routeColor}
          width={4}
          opacity={0.95}
        />
      )}
    </Map>
  );
}
