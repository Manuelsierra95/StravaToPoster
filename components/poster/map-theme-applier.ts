"use client";

/**
 * Map theme applier.
 *
 * Translates a semantic `PosterTheme.map` palette into `setPaintProperty`
 * calls on a live MapLibre map. The layer IDs in `LAYER_CATEGORIES` are
 * specific to Carto's positron-gl-style
 * (https://basemaps.cartocdn.com/gl/positron-gl-style/style.json).
 *
 * If the base style changes, `LAYER_CATEGORIES` must be re-mapped. After a
 * style.load, `validateThemeLayers()` will warn in dev if any critical
 * category resolves to zero present layers.
 */

import type { Map as MapLibreMap } from "maplibre-gl";

import type { MapPalette, PosterTheme, RoadCategory } from "@/lib/poster-themes";

const LAYER_CATEGORIES = {
  background: ["background"],
  vegetation: [
    "landcover",
    "park_national_park",
    "park_nature_reserve",
  ],
  land: {
    fill: ["landuse_residential", "landuse"],
    line: ["aeroway-runway", "aeroway-taxiway"],
  },
  water: {
    fill: ["water", "water_shadow"],
    line: ["waterway"],
  },
  buildings: ["building", "building-top"],
  roads: {
    motorway: [
      "tunnel_mot_case",
      "tunnel_mot_fill",
      "road_mot_case_noramp",
      "road_mot_fill_noramp",
      "road_mot_case_ramp",
      "road_mot_fill_ramp",
      "bridge_mot_case",
      "bridge_mot_fill",
    ],
    trunk: [
      "tunnel_trunk_case",
      "tunnel_trunk_fill",
      "road_trunk_case_noramp",
      "road_trunk_fill_noramp",
      "road_trunk_case_ramp",
      "road_trunk_fill_ramp",
      "bridge_trunk_case",
      "bridge_trunk_fill",
    ],
    primary: [
      "tunnel_pri_case",
      "tunnel_pri_fill",
      "road_pri_case_noramp",
      "road_pri_fill_noramp",
      "road_pri_case_ramp",
      "road_pri_fill_ramp",
      "bridge_pri_case",
      "bridge_pri_fill",
    ],
    secondary: [
      "tunnel_sec_case",
      "tunnel_sec_fill",
      "road_sec_case_noramp",
      "road_sec_fill_noramp",
      "bridge_sec_case",
      "bridge_sec_fill",
    ],
    minor: [
      "tunnel_minor_case",
      "tunnel_minor_fill",
      "road_minor_case",
      "road_minor_fill",
      "bridge_minor_case",
      "bridge_minor_fill",
      "tunnel_service_case",
      "tunnel_service_fill",
      "road_service_case",
      "road_service_fill",
      "bridge_service_case",
      "bridge_service_fill",
    ],
    path: ["tunnel_path", "road_path", "bridge_path"],
  },
  boundaries: [
    "boundary_country_outline",
    "boundary_country_inner",
    "boundary_state",
    "boundary_county",
  ],
  labels: [
    "waterway_label",
    "watername_ocean",
    "watername_sea",
    "watername_lake",
    "watername_lake_line",
    "roadname_minor",
    "roadname_sec",
    "roadname_pri",
    "roadname_major",
    "place_continent",
    "place_country_1",
    "place_country_2",
    "place_state",
    "place_city_dot_r2",
    "place_city_dot_r4",
    "place_city_dot_r7",
    "place_city_dot_z7",
    "place_capital_dot_z7",
    "place_city_r5",
    "place_city_r6",
    "place_town",
    "place_villages",
    "place_suburbs",
    "place_hamlet",
    "poi_park",
    "poi_stadium",
  ],
} as const;

function setIfPresent(
  map: MapLibreMap,
  layerId: string,
  paintKey: string,
  value: unknown,
): boolean {
  if (!map.getLayer(layerId)) return false;
  map.setPaintProperty(layerId, paintKey as never, value as never);
  return true;
}

export function applyTheme(map: MapLibreMap, theme: PosterTheme): void {
  const m = theme.map;

  if (m.background !== undefined) {
    setIfPresent(map, "background", "background-color", m.background);
  }

  if (m.vegetation !== undefined) {
    for (const id of LAYER_CATEGORIES.vegetation) {
      setIfPresent(map, id, "fill-color", m.vegetation);
    }
  }
  if (m.land !== undefined) {
    for (const id of LAYER_CATEGORIES.land.fill) {
      setIfPresent(map, id, "fill-color", m.land);
    }
    for (const id of LAYER_CATEGORIES.land.line) {
      setIfPresent(map, id, "line-color", m.land);
    }
  }
  if (m.water !== undefined) {
    for (const id of LAYER_CATEGORIES.water.fill) {
      setIfPresent(map, id, "fill-color", m.water);
    }
    for (const id of LAYER_CATEGORIES.water.line) {
      setIfPresent(map, id, "line-color", m.water);
    }
  }
  if (m.buildings !== undefined) {
    for (const id of LAYER_CATEGORIES.buildings) {
      setIfPresent(map, id, "fill-color", m.buildings);
    }
  }

  if (m.roads) {
    const roads = m.roads;
    (Object.keys(roads) as RoadCategory[]).forEach((category) => {
      const color = roads[category];
      if (color === undefined) return;
      for (const id of LAYER_CATEGORIES.roads[category]) {
        setIfPresent(map, id, "line-color", color);
      }
    });
  }

  if (m.boundaries !== undefined) {
    for (const id of LAYER_CATEGORIES.boundaries) {
      setIfPresent(map, id, "line-color", m.boundaries);
    }
  }

  if (m.labels) {
    for (const id of LAYER_CATEGORIES.labels) {
      setIfPresent(map, id, "text-color", m.labels.text);
      setIfPresent(map, id, "text-halo-color", m.labels.halo);
    }
  }
}

export type ThemeCategoryKey = "background" | "vegetation" | "water" | "roads" | "boundaries" | "labels";

export function validateThemeLayers(map: MapLibreMap): void {
  if (process.env.NODE_ENV === "production") return;

  const checks: Array<[ThemeCategoryKey, string[]]> = [
    ["background", [...LAYER_CATEGORIES.background]],
    ["vegetation", [...LAYER_CATEGORIES.vegetation]],
    [
      "water",
      [...LAYER_CATEGORIES.water.fill, ...LAYER_CATEGORIES.water.line],
    ],
    ["boundaries", [...LAYER_CATEGORIES.boundaries]],
    ["labels", [...LAYER_CATEGORIES.labels]],
  ];
  checks.push([
    "roads",
    (Object.keys(LAYER_CATEGORIES.roads) as RoadCategory[]).flatMap(
      (k) => [...LAYER_CATEGORIES.roads[k]],
    ),
  ]);

  for (const [key, ids] of checks) {
    const found = ids.some((id) => !!map.getLayer(id));
    if (!found) {
      console.warn(
        `[map-theme-applier] Theme category "${key}" matched zero layers in the loaded style. ` +
          `If you switched the base style away from positron-gl-style, re-map LAYER_CATEGORIES.`,
      );
    }
  }
}

export type { MapPalette };
