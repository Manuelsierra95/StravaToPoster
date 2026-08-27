"use client";

// TODO: persist poster config (theme, text/route color overrides, fonts,
// metric order/visibility, pitch/bearing) to localStorage so changes survive
// page reloads. Until then, all edits are in-memory only and reset whenever
// the provider remounts.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import {
  METRICS,
  RIDER_FIELDS,
  type ActivitySummary,
  type MetricId,
  type RiderFieldId,
  type RiderInfo,
  type ScrapedActivity,
  type StravaClub,
} from "@/lib/strava/types";
import { DEFAULT_THEME_ID, getTheme, type ThemeId } from "@/lib/poster-themes";

export const STRAVA_DISCONNECTED_EVENT = "strava:disconnected";

const CATALOG_PAGE_SIZE = 10;

type CatalogState = "idle" | "loading" | "loadingMore" | "error";

type ClubsState = "idle" | "loading" | "loaded" | "error";

type AuthState = {
  checked: boolean;
  connected: boolean;
  athleteFirstName: string | null;
  athleteLastName: string | null;
};

export type Orientation = "portrait" | "landscape";
export type ActivityCount = 1 | 2 | 3;
export type FrameId = "wood-light" | "black" | "white";

export const FRAME_OPTIONS: readonly {
  id: FrameId;
  label: string;
  description: string;
  outer: string;
  edge: string;
}[] = [
  {
    id: "black",
    label: "Negro",
    description: "Mate clásico",
    outer: "#0a0a0a",
    edge: "rgba(255, 255, 255, 0.08)",
  },
  {
    id: "white",
    label: "Blanco",
    description: "Limpio y minimalista",
    outer: "#e8e8e8",
    edge: "rgba(0, 0, 0, 0.12)",
  },
  {
    id: "wood-light",
    label: "Madera clara",
    description: "Roble natural",
    outer: "linear-gradient(135deg, #d4a574 0%, #c8965e 35%, #b88752 70%, #d4a574 100%)",
    edge: "rgba(0, 0, 0, 0.22)",
  },
] as const;

export type FontId =
  | "inter"
  | "jetbrains"
  | "space-grotesk"
  | "dm-sans"
  | "playfair"
  | "bebas";

export type FontOption = {
  id: FontId;
  label: string;
  cssVar: string;
};

export const FONT_OPTIONS: readonly FontOption[] = [
  { id: "inter", label: "Inter", cssVar: "var(--font-sans)" },
  { id: "jetbrains", label: "JetBrains Mono", cssVar: "var(--font-heading)" },
  { id: "space-grotesk", label: "Space Grotesk", cssVar: "var(--font-space-grotesk)" },
  { id: "dm-sans", label: "DM Sans", cssVar: "var(--font-dm-sans)" },
  { id: "playfair", label: "Playfair Display", cssVar: "var(--font-playfair)" },
  { id: "bebas", label: "Bebas Neue", cssVar: "var(--font-bebas)" },
] as const;

export const FONT_BY_ID: Record<FontId, FontOption> = FONT_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = option;
    return acc;
  },
  {} as Record<FontId, FontOption>,
);

export const MAX_SLOTS = 3;

export type SlotConfig = {
  /** User-customized route color. Falls back to the active theme's `route.default` when null. */
  routeColorOverride: string | null;
  elevationChartColor: string;
  pitch: number;
  bearing: number;
  zoom: number;
  showLabels: boolean;
  metricOrder: MetricId[];
  hiddenMetrics: MetricId[];
  riderSectionEnabled: boolean;
  riderFieldOrder: RiderFieldId[];
  hiddenRiderFields: RiderFieldId[];
  rider: RiderInfo;
};

export type PosterConfig = {
  orientation: Orientation;
  activityCount: ActivityCount;
  theme: ThemeId;
  /** User-customized poster text color. Falls back to the active theme's `poster.text` when null. */
  textColorOverride: string | null;
  headingFont: FontId;
  bodyFont: FontId;
  frame: FrameId;
};

export type PosterState = {
  activities: (ScrapedActivity | null)[];
  slotConfigs: SlotConfig[];
  loadingBySlot: Record<number, boolean>;
  errorsBySlot: Record<number, string | null>;
  config: PosterConfig;
  auth: AuthState;
  catalog: ActivitySummary[];
  catalogPage: number;
  catalogHasMore: boolean;
  catalogState: CatalogState;
  catalogError: string | null;
  athleteClubs: StravaClub[];
  athleteClubsState: ClubsState;
  athleteClubsError: string | null;
  /**
   * Ref pointing at the poster frame DOM node (the `[data-poster-frame]`
   * element). Populated by the `Poster` component so sibling trees (e.g. the
   * download button) can serialize it without prop-drilling.
   */
  posterFrameRef: MutableRefObject<HTMLDivElement | null>;
  /**
   * Snapshot of the currently-mounted MapLibre map instances, keyed by slot.
   * Populated by `<RouteMap>` as each `<Map>` instance becomes available and
   * drained when it unmounts.
   */
  mapsBySlot: Map<number, MapLibreMap>;
  registerMap: (slot: number, map: MapLibreMap) => () => void;
  loadActivity: (input: string, slot: number) => Promise<void>;
  setActivityCount: (count: ActivityCount) => void;
  setConfig: (patch: Partial<PosterConfig>) => void;
  setSlotConfig: (slot: number, patch: Partial<SlotConfig>) => void;
  setMetricVisible: (slot: number, id: MetricId, visible: boolean) => void;
  reorderMetrics: (slot: number, fromIndex: number, toIndex: number) => void;
  setRiderSectionEnabled: (slot: number, enabled: boolean) => void;
  setRiderField: (slot: number, id: RiderFieldId, value: string) => void;
  setRiderFieldVisible: (slot: number, id: RiderFieldId, visible: boolean) => void;
  reorderRiderFields: (slot: number, fromIndex: number, toIndex: number) => void;
  fetchAthleteClubs: () => Promise<void>;
  setTheme: (id: ThemeId) => void;
  setTextColor: (color: string) => void;
  resetTextColor: () => void;
  setRouteColor: (slot: number, color: string) => void;
  resetRouteColor: (slot: number) => void;
  fetchCatalog: (page: number, mode: "initial" | "more") => Promise<void>;
  resetCatalog: () => void;
  resetClubs: () => void;
  resetAuth: () => void;
  reset: () => void;
};

function createDefaultSlotConfig(): SlotConfig {
  return {
    routeColorOverride: null,
    elevationChartColor: "#fc4c02",
    pitch: 0,
    bearing: 0,
    zoom: 0,
    showLabels: true,
    metricOrder: METRICS.map((m) => m.id),
    hiddenMetrics: [],
    riderSectionEnabled: false,
    riderFieldOrder: RIDER_FIELDS.map((f) => f.id),
    hiddenRiderFields: [],
    rider: { name: "", club: "", bib: "" },
  };
}

const DEFAULT_CONFIG: PosterConfig = {
  orientation: "portrait",
  activityCount: 1,
  theme: DEFAULT_THEME_ID,
  textColorOverride: null,
  headingFont: "jetbrains",
  bodyFont: "inter",
  frame: "black",
};

function emptyLoadingRecord(): Record<number, boolean> {
  return { 0: false, 1: false, 2: false };
}

function emptyErrorsRecord(): Record<number, string | null> {
  return { 0: null, 1: null, 2: null };
}

const PosterContext = createContext<PosterState | null>(null);

export function PosterProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<(ScrapedActivity | null)[]>(
    () => [null, null, null],
  );
  const [slotConfigs, setSlotConfigs] = useState<SlotConfig[]>(() =>
    Array.from({ length: MAX_SLOTS }, createDefaultSlotConfig),
  );
  const [loadingBySlot, setLoadingBySlot] = useState<Record<number, boolean>>(
    emptyLoadingRecord,
  );
  const [errorsBySlot, setErrorsBySlot] = useState<Record<number, string | null>>(
    emptyErrorsRecord,
  );
  const [config, setConfigState] = useState<PosterConfig>(DEFAULT_CONFIG);
  const [auth, setAuth] = useState<AuthState>({
    checked: false,
    connected: false,
    athleteFirstName: null,
    athleteLastName: null,
  });
  const [catalog, setCatalog] = useState<ActivitySummary[]>([]);
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [catalogState, setCatalogState] = useState<CatalogState>("idle");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [athleteClubs, setAthleteClubs] = useState<StravaClub[]>([]);
  const [athleteClubsState, setAthleteClubsState] =
    useState<ClubsState>("idle");
  const [athleteClubsError, setAthleteClubsError] = useState<string | null>(
    null,
  );
  const catalogInitialFetchStarted = useRef(false);
  const clubsInitialFetchStarted = useRef(false);
  const posterFrameRef = useRef<HTMLDivElement | null>(null);
  const mapsBySlotRef = useRef<Map<number, MapLibreMap>>(new Map());
  const [mapsVersion, setMapsVersion] = useState(0);

  const registerMap = useCallback((slot: number, map: MapLibreMap) => {
    mapsBySlotRef.current.set(slot, map);
    setMapsVersion((v) => v + 1);
    return () => {
      if (mapsBySlotRef.current.get(slot) === map) {
        mapsBySlotRef.current.delete(slot);
        setMapsVersion((v) => v + 1);
      }
    };
  }, []);

  const setConfig = useCallback((patch: Partial<PosterConfig>) => {
    setConfigState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setSlotConfig = useCallback(
    (slot: number, patch: Partial<SlotConfig>) => {
      if (slot < 0 || slot >= MAX_SLOTS) return;
      setSlotConfigs((prev) => {
        const next = [...prev];
        next[slot] = { ...next[slot], ...patch };
        return next;
      });
    },
    [],
  );

  const setActivityCount = useCallback((count: ActivityCount) => {
    setConfigState((prev) => ({ ...prev, activityCount: count }));
  }, []);

  const setMetricVisible = useCallback(
    (slot: number, id: MetricId, visible: boolean) => {
      if (slot < 0 || slot >= MAX_SLOTS) return;
      setSlotConfigs((prev) => {
        const next = [...prev];
        const cfg = next[slot];
        const isHidden = cfg.hiddenMetrics.includes(id);
        if (visible && isHidden) {
          next[slot] = {
            ...cfg,
            hiddenMetrics: cfg.hiddenMetrics.filter((m) => m !== id),
          };
          return next;
        }
        if (!visible && !isHidden) {
          next[slot] = {
            ...cfg,
            hiddenMetrics: [...cfg.hiddenMetrics, id],
          };
          return next;
        }
        return prev;
      });
    },
    [],
  );

  const reorderMetrics = useCallback(
    (slot: number, fromIndex: number, toIndex: number) => {
      if (slot < 0 || slot >= MAX_SLOTS) return;
      setSlotConfigs((prev) => {
        const cfg = prev[slot];
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= cfg.metricOrder.length ||
          toIndex >= cfg.metricOrder.length
        ) {
          return prev;
        }
        const next = [...cfg.metricOrder];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        const nextSlotConfigs = [...prev];
        nextSlotConfigs[slot] = { ...cfg, metricOrder: next };
        return nextSlotConfigs;
      });
    },
    [],
  );

  const setRiderField = useCallback(
    (slot: number, id: RiderFieldId, value: string) => {
      if (slot < 0 || slot >= MAX_SLOTS) return;
      setSlotConfigs((prev) => {
        const next = [...prev];
        const cfg = next[slot];
        next[slot] = {
          ...cfg,
          rider: { ...cfg.rider, [id]: value },
        };
        return next;
      });
    },
    [],
  );

  const setRiderFieldVisible = useCallback(
    (slot: number, id: RiderFieldId, visible: boolean) => {
      if (slot < 0 || slot >= MAX_SLOTS) return;
      setSlotConfigs((prev) => {
        const next = [...prev];
        const cfg = next[slot];
        const isHidden = cfg.hiddenRiderFields.includes(id);
        if (visible && isHidden) {
          next[slot] = {
            ...cfg,
            hiddenRiderFields: cfg.hiddenRiderFields.filter((f) => f !== id),
          };
          return next;
        }
        if (!visible && !isHidden) {
          next[slot] = {
            ...cfg,
            hiddenRiderFields: [...cfg.hiddenRiderFields, id],
          };
          return next;
        }
        return prev;
      });
    },
    [],
  );

  const reorderRiderFields = useCallback(
    (slot: number, fromIndex: number, toIndex: number) => {
      if (slot < 0 || slot >= MAX_SLOTS) return;
      setSlotConfigs((prev) => {
        const cfg = prev[slot];
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= cfg.riderFieldOrder.length ||
          toIndex >= cfg.riderFieldOrder.length
        ) {
          return prev;
        }
        const next = [...cfg.riderFieldOrder];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        const nextSlotConfigs = [...prev];
        nextSlotConfigs[slot] = { ...cfg, riderFieldOrder: next };
        return nextSlotConfigs;
      });
    },
    [],
  );

  const setRiderSectionEnabled = useCallback(
    (slot: number, enabled: boolean) => {
      if (slot < 0 || slot >= MAX_SLOTS) return;
      setSlotConfigs((prev) => {
        const next = [...prev];
        const cfg = next[slot];
        if (enabled && !cfg.riderSectionEnabled) {
          const auto: RiderInfo = { ...cfg.rider };
          if (!auto.bib) auto.bib = "0000";
          if (!auto.name) {
            const first = auth.athleteFirstName?.trim() ?? "";
            const last = auth.athleteLastName?.trim() ?? "";
            const full = [first, last].filter(Boolean).join(" ");
            if (full) auto.name = full;
          }
          if (!auto.club) {
            auto.club = athleteClubs[0]?.name ?? "undefined";
          }
          next[slot] = {
            ...cfg,
            riderSectionEnabled: true,
            hiddenRiderFields: [],
            rider: auto,
          };
          return next;
        }
        if (!enabled && cfg.riderSectionEnabled) {
          next[slot] = { ...cfg, riderSectionEnabled: false };
          return next;
        }
        return prev;
      });
    },
    [auth.athleteFirstName, auth.athleteLastName, athleteClubs],
  );

  const setTheme = useCallback((id: ThemeId) => {
    setConfigState((prev) => (prev.theme === id ? prev : { ...prev, theme: id }));
  }, []);

  const setTextColor = useCallback((color: string) => {
    setConfigState((prev) => ({ ...prev, textColorOverride: color }));
  }, []);

  const resetTextColor = useCallback(() => {
    setConfigState((prev) => ({ ...prev, textColorOverride: null }));
  }, []);

  const setRouteColor = useCallback((slot: number, color: string) => {
    if (slot < 0 || slot >= MAX_SLOTS) return;
    setSlotConfigs((prev) => {
      const next = [...prev];
      next[slot] = { ...next[slot], routeColorOverride: color };
      return next;
    });
  }, []);

  const resetRouteColor = useCallback((slot: number) => {
    if (slot < 0 || slot >= MAX_SLOTS) return;
    setSlotConfigs((prev) => {
      const next = [...prev];
      next[slot] = { ...next[slot], routeColorOverride: null };
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setActivities([null, null, null]);
    setSlotConfigs(Array.from({ length: MAX_SLOTS }, createDefaultSlotConfig));
    setLoadingBySlot(emptyLoadingRecord());
    setErrorsBySlot(emptyErrorsRecord());
    setConfigState(DEFAULT_CONFIG);
    setAthleteClubs([]);
    setAthleteClubsState("idle");
    setAthleteClubsError(null);
    clubsInitialFetchStarted.current = false;
  }, []);

  const loadActivity = useCallback(async (input: string, slot: number) => {
    if (slot < 0 || slot >= MAX_SLOTS) return;
    setLoadingBySlot((prev) => ({ ...prev, [slot]: true }));
    setErrorsBySlot((prev) => ({ ...prev, [slot]: null }));
    try {
      const res = await fetch(
        `/api/strava/${encodeURIComponent(input.trim())}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { activity: ScrapedActivity };
      setActivities((prev) => {
        const next = [...prev];
        next[slot] = data.activity;
        return next;
      });
    } catch (err) {
      setActivities((prev) => {
        const next = [...prev];
        next[slot] = null;
        return next;
      });
      setErrorsBySlot((prev) => ({
        ...prev,
        [slot]: (err as Error).message ?? "Error desconocido",
      }));
    } finally {
      setLoadingBySlot((prev) => ({ ...prev, [slot]: false }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/strava/auth/status", {
            cache: "no-store",
          });
          const data = (await res.json()) as {
            connected: boolean;
            athlete?: {
              firstName?: string | null;
              lastName?: string | null;
            } | null;
          };
          if (!cancelled) {
            setAuth({
              checked: true,
              connected: Boolean(data.connected),
              athleteFirstName: data.athlete?.firstName ?? null,
              athleteLastName: data.athlete?.lastName ?? null,
            });
          }
        } catch {
          if (!cancelled) {
            setAuth({
              checked: true,
              connected: false,
              athleteFirstName: null,
              athleteLastName: null,
            });
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, []);

  const resetCatalog = useCallback(() => {
    setCatalog([]);
    setCatalogPage(0);
    setCatalogHasMore(false);
    setCatalogState("idle");
    setCatalogError(null);
    catalogInitialFetchStarted.current = false;
  }, []);

  const resetClubs = useCallback(() => {
    setAthleteClubs([]);
    setAthleteClubsState("idle");
    setAthleteClubsError(null);
    clubsInitialFetchStarted.current = false;
  }, []);

  const resetAuth = useCallback(() => {
    setAuth({
      checked: true,
      connected: false,
      athleteFirstName: null,
      athleteLastName: null,
    });
    resetCatalog();
    resetClubs();
  }, [resetCatalog, resetClubs]);

  useEffect(() => {
    const handler = () => resetAuth();
    window.addEventListener(STRAVA_DISCONNECTED_EVENT, handler);
    return () => window.removeEventListener(STRAVA_DISCONNECTED_EVENT, handler);
  }, [resetAuth]);

  const fetchCatalog = useCallback(
    async (targetPage: number, mode: "initial" | "more") => {
      setCatalogState((prev) => {
        if (mode === "initial" && prev === "loading") return prev;
        if (mode === "initial") return "loading";
        if (prev === "loading") return "loadingMore";
        return prev;
      });
      setCatalogError(null);
      try {
        const res = await fetch(
          `/api/strava/activities?page=${targetPage}&perPage=${CATALOG_PAGE_SIZE}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as {
          activities?: ActivitySummary[];
          hasMore?: boolean;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? `Error ${res.status}`);
        }
        const incoming = data.activities ?? [];
        setCatalog((prev) =>
          mode === "initial" ? incoming : [...prev, ...incoming],
        );
        setCatalogHasMore(Boolean(data.hasMore));
        setCatalogPage(targetPage);
        setCatalogState("idle");
      } catch (err) {
        setCatalogError((err as Error).message ?? "Error desconocido");
        setCatalogState("error");
      }
    },
    [],
  );

  useEffect(() => {
    if (!auth.connected) {
      catalogInitialFetchStarted.current = false;
      return;
    }
    if (catalogInitialFetchStarted.current) return;
    if (catalog.length > 0 || catalogState === "loading") return;
    catalogInitialFetchStarted.current = true;
    void fetchCatalog(1, "initial");
  }, [auth.connected, catalog.length, catalogState, fetchCatalog]);

  const fetchAthleteClubs = useCallback(async () => {
    setAthleteClubsState((prev) => (prev === "loading" ? prev : "loading"));
    setAthleteClubsError(null);
    try {
      const res = await fetch("/api/strava/athlete/clubs", {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          requiresAuth?: boolean;
        };
        if (data.requiresAuth) {
          setAthleteClubsState("idle");
          return;
        }
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { clubs?: StravaClub[] };
      setAthleteClubs(data.clubs ?? []);
      setAthleteClubsState("loaded");
    } catch (err) {
      setAthleteClubsError((err as Error).message ?? "Error desconocido");
      setAthleteClubsState("error");
    }
  }, []);

  useEffect(() => {
    if (!auth.connected) {
      clubsInitialFetchStarted.current = false;
      return;
    }
    if (clubsInitialFetchStarted.current) return;
    if (
      athleteClubsState === "loading" ||
      athleteClubsState === "loaded"
    ) {
      return;
    }
    clubsInitialFetchStarted.current = true;
    void fetchAthleteClubs();
  }, [
    auth.connected,
    athleteClubsState,
    fetchAthleteClubs,
  ]);

  const value = useMemo<PosterState>(
    () => ({
      activities,
      slotConfigs,
      loadingBySlot,
      errorsBySlot,
      config,
      auth,
      catalog,
      catalogPage,
      catalogHasMore,
      catalogState,
      catalogError,
      athleteClubs,
      athleteClubsState,
      athleteClubsError,
      posterFrameRef,
      // Re-create the snapshot whenever maps register/unregister so consumers
      // re-render with the current set of maps.
      mapsBySlot: new Map(mapsBySlotRef.current),
      registerMap,
      loadActivity,
      setActivityCount,
      setConfig,
      setSlotConfig,
      setMetricVisible,
      reorderMetrics,
      setRiderSectionEnabled,
      setRiderField,
      setRiderFieldVisible,
      reorderRiderFields,
      fetchAthleteClubs,
      setTheme,
      setTextColor,
      resetTextColor,
      setRouteColor,
      resetRouteColor,
      fetchCatalog,
      resetCatalog,
      resetClubs,
      resetAuth,
      reset,
    }),
    /* eslint-disable react-hooks/exhaustive-deps --
       `mapsVersion` is an indirect invalidation signal: it changes whenever a
       MapLibre instance registers or unregisters with the provider, which is
       how consumers (e.g. the download button) learn about new map instances
       without observing a ref. The exhaustive-deps rule can't see this
       pattern because the snapshot value (`new Map(mapsBySlotRef.current)`)
       reads from a ref. */
    [
      activities,
      slotConfigs,
      loadingBySlot,
      errorsBySlot,
      config,
      auth,
      catalog,
      catalogPage,
      catalogHasMore,
      catalogState,
      catalogError,
      athleteClubs,
      athleteClubsState,
      athleteClubsError,
      registerMap,
      mapsVersion,
      loadActivity,
      setActivityCount,
      setConfig,
      setSlotConfig,
      setMetricVisible,
      reorderMetrics,
      setRiderSectionEnabled,
      setRiderField,
      setRiderFieldVisible,
      reorderRiderFields,
      fetchAthleteClubs,
      setTheme,
      setTextColor,
      resetTextColor,
      setRouteColor,
      resetRouteColor,
      fetchCatalog,
      resetCatalog,
      resetClubs,
      resetAuth,
      reset,
    ],
  );

  return <PosterContext.Provider value={value}>{children}</PosterContext.Provider>;
}

export function usePoster(): PosterState {
  const ctx = useContext(PosterContext);
  if (!ctx) {
    throw new Error("usePoster must be used within a PosterProvider");
  }
  return ctx;
}

/** Effective poster text color: override or active theme's default. */
export function useEffectiveTextColor(): string {
  const { config } = usePoster();
  return config.textColorOverride ?? getTheme(config.theme).poster.text;
}

/** Effective route color for a slot: override or active theme's default. */
export function useEffectiveRouteColor(slot: number): string {
  const { slotConfigs, config } = usePoster();
  const cfg = slotConfigs[slot];
  return cfg.routeColorOverride ?? getTheme(config.theme).route.default;
}
