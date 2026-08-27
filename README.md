# StravaToPoster

A print-ready poster generator built from Strava activities. The app pulls a ride, run or hike from the Strava API, decodes its polyline, renders it on a fully themable MapLibre basemap, and lets the user customize everything (orientation, frame, palette, typography, route color, pitch, metrics ordering, rider card) before exporting a high-DPI PNG.

## Why this project exists

Strava has no "print my ride" feature. Existing workarounds — Strava's own share image, third-party screenshot tools — give you a fixed crop of the activity page. **StravaToPoster** treats each activity as a design primitive: a route, an elevation profile, a set of metrics and an athlete. You compose them into something that actually looks good framed on a wall.

The editor has no business logic of its own — every visual choice is a pure function of `(theme, slotConfig, activity)`. That makes the whole rendering pipeline deterministic, replayable and trivially testable.

---

## Tech highlights

| Area | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16.2** | App Router, RSC, Server Actions |
| Rendering | **Cache Components + Instant Navigations** | PPR + `unstable_instant` |
| UI runtime | React 19.2 | `<Activity>` preserved across nav |
| Styling | Tailwind v4 + shadcn/ui (`@base-ui/react`) | `@theme inline` tokens |
| Maps | MapLibre GL JS 6 (via [mapcn](https://www.mapcn.dev)) | Carto positron + Esri satellite |
| Auth | Strava OAuth 2.0 | Tokens held in `httpOnly` cookies server-side |
| Testing | Playwright + `@next/playwright` `instant()` | E2E regression guards |

---

## Next.js 16: Cache Components & Instant Navigations

This app is built around two of the newest Next.js primitives — both are still under active iteration, and both are load-bearing for how the UX feels.

### Cache Components

`next.config.ts` opts the whole app in:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
};
```

That single flag unlocks three things:

1. **PPR** (Partial Prerendering). The static shell of a route is prerendered at build time and served from the edge; the dynamic parts stream in over the same HTTP response.
2. **`'use cache'`** on async server functions, with `cacheLife()` and `cacheTag()` for invalidation control. Cache key = build ID + function ID + serialized args + closure vars.
3. **`<Activity>`** (React 19) for preserved state across navigations — see `app/layout.tsx:58` (`export const unstable_instant = false`).

The Strava clubs endpoint (`lib/strava/oauth.ts:498`) is a textbook example:

```ts
export async function getCachedAthleteClubs(accessToken: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("strava:athlete-clubs");
  return fetchAthleteClubsUncached(accessToken);
}
```

It cannot read `cookies()` directly (the directive forbids it), so the access token is read **outside** the cache scope and passed in. The cache key includes the token hash, which is the correct behavior: clubs are per-user, and a stale clubs list is harmless because `revalidateTag("strava:athlete-clubs")` is the contract for mutations.

### Instant Navigations

Every route exports `unstable_instant`. The layout (`app/layout.tsx:58`) opts out because it injects font CSS variables that depend on theme provider context — instant there would over-commit. Every **page** opts back in:

```ts
// app/page.tsx:11
export const unstable_instant = { prefetch: "static" };
```

This declaration is not just documentation. At build/dev time, Next validates that the static shell of this route can render at every shared layout boundary. If a Suspense boundary is misplaced (e.g. a `cookies()` read outside any `<Suspense>`), the validation fails — the silent blocker where client navigations feel "dead" is caught at build time, not in user reports.

The runtime split looks like this:

- **Static shell** (prerendered): `<PosterProvider>` shell, the empty poster placeholder, the editor panel chrome (controls without data). Zero cookies, zero headers, zero `searchParams`.
- **Streaming**: `<EditorPanel>` inside `<Suspense fallback={<EditorSkeleton />}>` (`app/page.tsx:39`). The panel reads auth status, the activity catalog, athlete clubs — all of which depend on the user's Strava cookies.
- **Map attribution** is wrapped separately at `app/page.tsx:34` because it loads after the basemap is interactive.

### DevTools

The `instantNavigationDevToolsToggle` flag adds an **Instant Navs** panel to Next.js DevTools. Two things to verify when iterating:

1. **Page load** — does the static shell appear before the dynamic editor streams in?
2. **Client navigation** — when prefetching a route, does the cached UI match the static shell exactly? Any visible diff is a Suspense-placement bug.

---

## Architecture

### State: a single `PosterProvider`

The entire editor is driven by one React context (`components/poster-provider.tsx`). It owns:

- A `PosterConfig` (orientation, theme, fonts, frame, text color override).
- An array of up to three `SlotConfig`s — one per slot in a multi-activity poster. Each slot tracks its own route color, pitch, bearing, zoom, label visibility, metric order/visibility, and rider card fields.
- The loaded activities (`(ScrapedActivity | null)[]`), loading flags and per-slot errors.
- Auth state and a paginated activity catalog (Strava `athlete/activities`).
- A `posterFrameRef` so the **Download** button (which lives in a sibling subtree) can reach the DOM node it needs to serialize.
- A `mapsBySlot: Map<number, MapLibreMap>` so the snapshot pipeline can `triggerRepaint()` on every active map before exporting.

Slot state is intentionally separate from "global" state. Theme and frame are global because changing them affects every slot; route color and pitch are per-slot because a tri-activity poster can have three different routes rendered differently.

### Map theming via paint properties

The Carto positron-gl-style exposes ~50 categorized layers (motorway, trunk, primary, secondary, minor, path, water, vegetation, buildings, boundaries, labels). `components/poster/map-theme-applier.ts` maps a semantic `MapPalette` to `setPaintProperty` calls on those exact layer IDs. The mapping is table-driven:

```ts
const LAYER_CATEGORIES = {
  roads: {
    motorway: ["tunnel_mot_case", "road_mot_case_noramp", "bridge_mot_case", ...],
    trunk:   ["tunnel_trunk_case", "road_trunk_case_noramp", "bridge_trunk_case", ...],
    ...
  },
  ...
};
```

Switching theme is then a single loop over `Object.entries(theme.map.roads)` per category — no style swap, no tile reload, no flicker. `validateThemeLayers()` runs once per style change and warns in dev if a theme category matches zero loaded layers (e.g. when you swap a satellite raster basemap that has no categorized layers).

### Polyline decoding & fitting

Strava returns encoded polylines via `summary_polyline`. `lib/strava-polyline.ts` decodes with `@mapbox/polyline`, then `getBounds()` reduces to a single pass over the lat/lng array (no intermediate allocations). `getCenterAndZoom()` picks a zoom level from the bounding-box diagonal in degrees — a coarser-grained but cache-free heuristic that avoids spinning up a viewport-calculation pipeline.

`<RouteMap>` (`components/poster/route-map.tsx`) registers its MapLibre instance with the provider as soon as the forwarded ref is populated. A short `requestAnimationFrame` retry loop covers the gap between mount and ref fill — needed because the Map component's ref is filled in its commit phase, which can be a frame late.

### ResizeObserver at the wrapper level

MapLibre's internal resize observer only watches the map container itself. When the parent flex layout changes — the classic 1 → 3 → 1 activity count flow — the container's box can briefly lag behind. `<RouteMap>` attaches its own `ResizeObserver` to the **wrapper** element (not the canvas) so it fires immediately on every wrapper size change and `map.resize()` updates the canvas resolution before the next paint. This regression is guarded by `tests/e2e/poster-resize.spec.ts:123`.

### Synchronized panel heights

When two activities are side by side, their metrics `<footer>`s should be the same height so the maps line up. `components/poster/height-sync.ts` implements a tiny pub/sub keyed by a `namespace` string ("metrics", "title"):

```ts
const buckets = new Map<string, Map<number, number>>();
const listeners = new Map<string, Set<Listener>>();
```

Each panel reports its natural height via `ResizeObserver` → `reportHeight(METRICS_NS, slot, height)`. A recompute finds the max and fans out to subscribers. Consumers call `useMaxHeight(METRICS_NS)` which wraps `useSyncExternalStore` for concurrent-safe subscriptions. The `reportHeight(_, slot, null)` removal path always recomputes — even if the deleted height equalled the new max, a sibling slot needs its `minHeight` constraint re-evaluated.

### DOM snapshot to PNG

`lib/poster-snapshot.ts` exports the poster as a 2× PNG via `html-to-image`. The pipeline:

1. `triggerRepaint()` on every MapLibre instance and `await waitForMapsIdle(maps)` — otherwise the WebGL framebuffer can be mid-load and the export shows a grey basemap.
2. `await new Promise(r => requestAnimationFrame(() => r(null)))` — one extra frame so the just-triggered repaint lands before the read.
3. `await document.fonts.ready` + `getFontEmbedCSS()` — Google Fonts loaded via `next/font` need to be embedded as `@font-face` data URLs inside the serialized SVG.
4. `toPng(node, { pixelRatio: 2, cacheBust: true, filter: ... })`. The `filter` strips `maplibregl-ctrl` and the loading overlay before serialization — they shouldn't appear in the export.
5. `dataUrlToBlob` → `URL.createObjectURL` → click an invisible `<a>` with `download`. Object URL is revoked 5s later (conservative — modern browsers fire the download in ~100ms).

### Strava OAuth flow

The whole flow is server-side. Tokens never touch the client.

- `lib/strava/oauth.ts:100` exchanges the auth code for tokens.
- `storeTokens()` writes four `httpOnly`, `sameSite=lax`, `secure` (in prod) cookies with a 30-day max-age.
- `getValidAccessToken()` checks `expiresAt - now < 60s` and silently refreshes via `refreshTokens()` before any Strava call.
- `clearTokens()` deletes all four cookies on disconnect.

A `STRAVA_DISCONNECTED_EVENT` window event lets the provider reset its auth/catalog/clubs state without a hard reload.

---

## UX details worth knowing

- **Drag & drop reordering** for metric cards and rider fields uses `react-dnd` with the HTML5 backend (`components/ui/drag-and-drop.tsx`). Each DnD surface gets its own `DragAndDropProvider` so providers don't fight over global state.
- **Slot selectors** appear in the *Recorrido*, *Gráfico*, *Mapa* and *Métricas* sections, so each per-slot control scopes itself to one activity in a multi-activity poster.
- **Speed vs pace**: when the activity type is run/hike/walk, speed metrics auto-switch to pace format (`lib/format.ts:36`). The switch is driven by `isPaceActivity(activity.type)` so it follows the data, not a UI toggle.
- **Theme defaults vs overrides**: every themeable value (route color, text color) has both a theme default and a per-slot/user override. The override is `null` by default; `useEffectiveRouteColor(slot)` and `useEffectiveTextColor()` are the two hooks that resolve "what color is actually rendered".
- **Hydration mismatch guard** on the download button (`components/poster/download-poster-button.tsx:106`): React 19 + `@base-ui/react` would otherwise serialize `disabled={false}` as no attribute but normalize to `disabled={true}` on the client. The `disabled={!canCapture || undefined}` trick keeps the prop `undefined` when enabled, so SSR and hydration agree.

---

## Testing

Two e2e regression guards in `tests/e2e/poster-resize.spec.ts`:

1. **Map canvas recovery after slot count toggling** (1 → 3 → 1) — verifies that the canvas CSS size and internal `width`/`height` attributes stay in sync after a fast layout churn. Without the wrapper-level `ResizeObserver`, MapLibre's internal 50ms-throttled observer would miss the resize and the export would capture a stale framebuffer.
2. **No hydration mismatch on initial load** — listens for console entries matching `/hydrat|didn't match|tree hydrated/` after a real load and asserts the array is empty.

A third test covers the "remove a metric, map grows" flow — guards the `metricsRef` placement inside `<MetricsGrid>` (attaching to an inner `<div>` so the observer sees natural content height, not the `minHeight`-forced one).

`@next/playwright` exports an `instant(page, async () => { ... })` helper for scoping assertions to the prefetched static shell. Build-time `unstable_instant` validation is the primary guard; `instant()` tests are the secondary one for flows that matter most.

---

## Getting started

1. Register an app at <https://www.strava.com/settings/api>. Set the **Authorization Callback Domain** to `localhost` for dev.
2. Copy env:
   ```bash
   cp .env.example .env.local
   # fill STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET
   ```
3. Install + run:
   ```bash
   pnpm install
   pnpm dev
   ```
4. Open <http://localhost:3000>, click **Conectar con Strava**, paste an activity URL or ID in the right panel.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next dev server (port 3000) |
| `pnpm build` | Production build (validates `unstable_instant`) |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint (Next config) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test:e2e` | Playwright e2e |
| `pnpm format` | Prettier write |

---

## File map

```
app/
  layout.tsx                 # Root layout (unstable_instant = false)
  page.tsx                   # Poster + editor (unstable_instant = { prefetch: "static" })
  api/strava/
    auth/[authorize|callback|disconnect|status]/route.ts
    activities/route.ts      # Paginated activity catalog
    athlete/clubs/route.ts
    [id]/route.ts            # Single activity detail + streams
components/
  poster-provider.tsx        # Single source of truth for editor state
  poster/                    # Map, metrics, elevation chart, download button, themes
  editor/                    # All sidebar controls (one file per concern)
  ui/                        # shadcn primitives + mapcn wrapper + DnD wrapper
lib/
  strava/oauth.ts            # Token exchange, refresh, cookie storage
  strava-polyline.ts         # Polyline decode + bounds + viewport heuristic
  poster-themes.ts           # 8 themes (4 vector + 3 satellite variants)
  poster-snapshot.ts         # DOM → PNG pipeline
  poster-color.ts            # Hex ↔ RGBA + WCAG luminance
  format.ts                  # Distance / pace / speed / elevation / date formatters
tests/e2e/
  poster-resize.spec.ts      # Regression guards
```

---

## Known limitations / future work

- **No persistence.** All editor state lives in memory; a refresh wipes your theme + customizations. The next iteration would persist to `localStorage` (or, for cross-device, to a `poster_config` table keyed by athlete ID).
- **Single activity source.** Only Strava. The polyline decoder and metrics formatter are Strava-shaped; a second source (Garmin Connect, GPX upload) would need adapter types.
- **Print spec is implicit.** Exports are PNG at 2×. A real print pipeline would emit a PDF/X-3 with a CMYK conversion and bleed marks.
- **No CSP / sandbox hardening on the snapshot.** `html-to-image` serializes inline styles into a `<foreignObject>`; a stricter CSP would need an isolated export route.
