import type { StyleSpecification } from "maplibre-gl";

export type ThemeId =
  | "minimal"
  | "dark"
  | "light"
  | "terrain"
  | "monochrome"
  | "satellite";

export type RoadCategory =
  | "motorway"
  | "trunk"
  | "primary"
  | "secondary"
  | "minor"
  | "path";

/**
 * Pure raster satellite style. No themable layers — the imagery IS the map.
 * The Esri World Imagery tiles carry their own attribution.
 */
export const SATELLITE_STYLE: StyleSpecification = {
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

/**
 * Default base style URL for themes that re-paint positron-gl-style.
 */
export const DEFAULT_BASE_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/**
 * A map palette is the full set of paint properties we know how to override on
 * a categorized basemap (positron-gl-style). Every field is optional: a theme
 * can omit categories it doesn't care about (e.g. `satellite` has no
 * themable layers and only specifies `baseStyle`).
 *
 * `baseStyle` accepts either a remote URL or a `StyleSpecification`. When
 * omitted the consumer falls back to positron-gl-style.
 */
export type MapPalette = {
  baseStyle?: string | StyleSpecification;
  background?: string;
  land?: string;
  vegetation?: string;
  water?: string;
  buildings?: string;
  roads?: Partial<Record<RoadCategory, string>>;
  boundaries?: string;
  labels?: { text: string; halo: string };
};

export type PosterTheme = {
  id: ThemeId;
  label: string;
  poster: { background: string; text: string };
  map: MapPalette;
  route: { default: string };
};

export const POSTER_THEMES: Record<ThemeId, PosterTheme> = {
  minimal: {
    id: "minimal",
    label: "Minimal",
    poster: { background: "#f7f5f0", text: "#1f1d1a" },
    map: {
      background: "#f7f5f0",
      land: "#f7f5f0",
      vegetation: "#dde6d4",
      water: "#c8dbdb",
      buildings: "#e0ddd5",
      roads: {
        motorway: "#ffffff",
        trunk: "#ffffff",
        primary: "#ffffff",
        secondary: "#faf9f5",
        minor: "#ebe9e3",
        path: "#ebe9e3",
      },
      boundaries: "#c8c4ba",
      labels: { text: "#5a544c", halo: "#f7f5f0" },
    },
    route: { default: "#fc4c02" },
  },

  dark: {
    id: "dark",
    label: "Dark",
    poster: { background: "#171717", text: "#f5f5f5" },
    map: {
      background: "#171717",
      land: "#171717",
      vegetation: "#243429",
      water: "#1e3a5f",
      buildings: "#252525",
      roads: {
        motorway: "#4a4a4a",
        trunk: "#4a4a4a",
        primary: "#3a3a3a",
        secondary: "#2a2a2a",
        minor: "#222222",
        path: "#222222",
      },
      boundaries: "#4a4a4a",
      labels: { text: "#e5e5e5", halo: "#171717" },
    },
    route: { default: "#ff6b35" },
  },

  light: {
    id: "light",
    label: "Light",
    poster: { background: "#ffffff", text: "#000000" },
    map: {
      background: "#ffffff",
      land: "#ffffff",
      vegetation: "#c8e0c0",
      water: "#a8d4e8",
      buildings: "#d8d8d8",
      roads: {
        motorway: "#ffffff",
        trunk: "#ffffff",
        primary: "#ffffff",
        secondary: "#f8f8f8",
        minor: "#e8e8e8",
        path: "#e8e8e8",
      },
      boundaries: "#b0b0b0",
      labels: { text: "#000000", halo: "#ffffff" },
    },
    route: { default: "#0066cc" },
  },

  terrain: {
    id: "terrain",
    label: "Terrain",
    poster: { background: "#e8dcc4", text: "#2a1810" },
    map: {
      background: "#e8dcc4",
      land: "#e8dcc4",
      vegetation: "#7a8a5c",
      water: "#5a8896",
      buildings: "#c8b896",
      roads: {
        motorway: "#fff5dc",
        trunk: "#fff5dc",
        primary: "#fff5dc",
        secondary: "#e8dcc4",
        minor: "#d4c4a0",
        path: "#d4c4a0",
      },
      boundaries: "#7a6440",
      labels: { text: "#2a1810", halo: "#e8dcc4" },
    },
    route: { default: "#a8341c" },
  },

  monochrome: {
    id: "monochrome",
    label: "Monochrome",
    poster: { background: "#0a0a0a", text: "#fafafa" },
    map: {
      background: "#0a0a0a",
      land: "#0a0a0a",
      vegetation: "#1a1a1a",
      water: "#000000",
      buildings: "#1f1f1f",
      roads: {
        motorway: "#4a4a4a",
        trunk: "#4a4a4a",
        primary: "#3a3a3a",
        secondary: "#2a2a2a",
        minor: "#1a1a1a",
        path: "#1a1a1a",
      },
      boundaries: "#3a3a3a",
      labels: { text: "#d4d4d4", halo: "#000000" },
    },
    route: { default: "#fafafa" },
  },

  satellite: {
    id: "satellite",
    label: "Satélite",
    poster: { background: "#0a0e14", text: "#f0f0f0" },
    map: {
      // The satellite raster IS the map; no paint overrides. The bright
      // orange route line stands out against the natural imagery.
      baseStyle: SATELLITE_STYLE,
    },
    route: { default: "#fc4c02" },
  },
};

export const THEME_ORDER: readonly ThemeId[] = [
  "minimal",
  "dark",
  "light",
  "terrain",
  "monochrome",
  "satellite",
];

export const DEFAULT_THEME_ID: ThemeId = "minimal";

export function getTheme(id: ThemeId): PosterTheme {
  return POSTER_THEMES[id];
}
