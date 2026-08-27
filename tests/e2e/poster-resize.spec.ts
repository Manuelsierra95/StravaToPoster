import { test, expect, type Page } from "@playwright/test";

const FAKE_ACTIVITY = {
  id: 1,
  name: "Test ride",
  type: "Ride",
  sportType: "Ride",
  startDateLocal: "2024-01-01T10:00:00Z",
  description: "",
  distance: 12345,
  movingTime: 1800,
  elapsedTime: 2000,
  totalElevationGain: 100,
  elevHigh: 700,
  elevLow: 600,
  averageSpeed: 6.86,
  maxSpeed: 12.5,
  averageHeartrate: 140,
  maxHeartrate: 165,
  hasHeartrate: true,
  averageWatts: 200,
  maxWatts: 400,
  deviceWatts: true,
  averageCadence: 85,
  calories: 500,
  summaryPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  elevationPoints: null,
  athleteFirstName: "Test",
  athleteLastName: "User",
};

/**
 * Install a Strava API stub on the page. Activities load with `FAKE_ACTIVITY`
 * regardless of the input URL; auth status returns disconnected so we don't
 * have to mock OAuth.
 */
async function installStravaMock(page: Page) {
  await page.route("**/api/strava/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/strava/auth/status")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connected: false, athlete: null }),
      });
    }
    if (url.includes("/api/strava/athlete/clubs")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ clubs: [] }),
      });
    }
    if (url.includes("/api/strava/activities")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ activities: [], hasMore: false }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ activity: FAKE_ACTIVITY }),
    });
  });
}

async function loadFirstActivity(page: Page) {
  const trigger = page
    .getByRole("button", { name: /Abrir actividad/ })
    .first();
  await trigger.click();
  const urlInput = page.getByPlaceholder(/strava\.com\/activities/).first();
  await urlInput.waitFor({ state: "visible" });
  await urlInput.fill("https://www.strava.com/activities/1");
  await urlInput.press("Enter");

  const scope = page.locator("[data-poster-scope]");
  await expect(scope.locator("canvas").first()).toBeVisible({ timeout: 5000 });
  return scope;
}

/**
 * Read the bottom gap between the panel's last child (footer/metrics) and
 * the panel edge. A positive value means there's whitespace below the
 * metrics — the bug we're guarding against.
 */
async function readPanelBottomGap(page: Page): Promise<number> {
  return page.evaluate(() => {
    const scope = document.querySelector("[data-poster-scope]");
    if (!scope) return -1;
    // The panel is the first flex row/col child of the scope.
    const panel = scope.querySelector("div > div");
    const metrics = scope.querySelector("footer");
    if (!panel || !metrics) return -1;
    const panelRect = panel.getBoundingClientRect();
    const metricsRect = metrics.getBoundingClientRect();
    return panelRect.bottom - metricsRect.bottom;
  });
}

/**
 * Regression guard for the "1 → 3 → 1 activity" flow.
 *
 * Before the fix: when the user went 1 → 3 → 1, the panel in slot 0 stayed at
 * the compressed size it had while it had two siblings. The map canvas
 * didn't recover its full width because:
 *   - `RouteMap`'s wrapper-level ResizeObserver was wired up in
 *     `route-map.tsx` but `ActivityPanel` never forwarded the `mapWrapperRef`
 *     to it, so the observer early-returned and `map.resize()` never ran.
 *   - MapLibre's internal observer (`trackResize`, throttled 50 ms) handled
 *     the eventual resize, but a fast follow-up action (e.g. exporting the
 *     poster right after toggling) could still capture the canvas at its
 *     previous internal resolution.
 *
 * After the fix: `ActivityPanel` creates the wrapper ref and forwards it to
 * `RouteMap`, so the external observer fires immediately on every wrapper
 * size change and `map.resize()` updates the canvas resolution before the
 * next frame.
 */
test.describe("poster layout resilience", () => {
  test("map canvas recovers full size after count 1 → 3 → 1", async ({
    page,
  }) => {
    await installStravaMock(page);
    await page.goto("/");
    await expect(page.getByText("Tu poster aparecerá aquí")).toBeVisible();

    const actividades = page.locator("section", { hasText: "Actividades" });

    // Start with 1 activity loaded (the user's reported scenario: 1 → 3 → 1).
    await actividades.getByRole("button", { name: "1", exact: true }).click();
    const scope = await loadFirstActivity(page);
    const canvas = scope.locator("canvas").first();

    // Capture the original (1-activity) canvas size.
    const canvasBox1 = await canvas.boundingBox();
    expect(canvasBox1).not.toBeNull();

    // Switch to 3 activities (slots 1 and 2 stay empty — same as user flow).
    await actividades.getByRole("button", { name: "3", exact: true }).click();
    await page.waitForTimeout(400);

    // Switch back to 1 activity.
    await actividades.getByRole("button", { name: "1", exact: true }).click();
    await page.waitForTimeout(400);

    const scopeBox1 = await scope.boundingBox();
    const canvasBox1After = await canvas.boundingBox();
    expect(scopeBox1).not.toBeNull();
    expect(canvasBox1After).not.toBeNull();

    const contentWidth = scopeBox1!.width - 48;
    // Canvas must recover at least 80% of the single-panel content width.
    expect(canvasBox1After!.width).toBeGreaterThan(contentWidth * 0.8);

    // It must also recover to (approximately) its original 1-activity width.
    expect(canvasBox1After!.width).toBeGreaterThan(canvasBox1!.width * 0.9);

    // Canvas internal resolution must match its CSS size (else it's the
    // classic "stale canvas" symptom of the resize bug).
    const internalSize = await canvas.evaluate((node) => ({
      cssW: (node as HTMLCanvasElement).clientWidth,
      cssH: (node as HTMLCanvasElement).clientHeight,
      attrW: (node as HTMLCanvasElement).width,
      attrH: (node as HTMLCanvasElement).height,
    }));
    // CSS size and attribute size should be within 5% of each other.
    expect(Math.abs(internalSize.attrW - internalSize.cssW)).toBeLessThan(
      internalSize.cssW * 0.05,
    );
    expect(Math.abs(internalSize.attrH - internalSize.cssH)).toBeLessThan(
      internalSize.cssH * 0.05,
    );

    // No whitespace below the metrics.
    expect(await readPanelBottomGap(page)).toBeLessThan(2);
  });

  /**
   * Regression guard for hydration mismatches on initial page load.
   *
   * Before the fix: React 19 + `@base-ui/react/button` rendered the
   * download button with `disabled={false}` during SSR (no attribute), but
   * the client normalized `disabled` to `true` during hydration, tripping
   * a hydration warning. Passing `disabled={!canCapture || undefined}`
   * (instead of `disabled={!canCapture}`) keeps the prop `undefined` when
   * the button is enabled, so both server and client agree on "no
   * attribute".
   */
  test("no hydration mismatch on initial load", async ({ page }) => {
    const consoleEntries: { type: string; text: string }[] = [];
    page.on("console", (msg) => {
      consoleEntries.push({
        type: msg.type(),
        text: msg.text(),
      });
    });
    page.on("pageerror", (err) => {
      consoleEntries.push({ type: "pageerror", text: err.message });
    });

    await installStravaMock(page);
    await page.goto("/");

    // Give React a chance to hydrate and emit any mismatch warnings.
    await page.waitForTimeout(500);

    // eslint-disable-next-line no-console
    console.log(
      "All console entries:",
      consoleEntries.map((e) => `[${e.type}] ${e.text.substring(0, 200)}`),
    );

    const hydrationIssues = consoleEntries.filter(({ text }) =>
      /hydrat|didn'?t match|tree hydrated/i.test(text),
    );
    expect(hydrationIssues).toEqual([]);
  });

  /**
   * Regression guard for "remove a metric and the map should grow".
   *
   * Before the fix: the metrics `<footer>` carried the synchronized
   * `minHeight`. The ResizeObserver that reported the natural height was
   * also attached to the footer, but with `minHeight` forcing the height,
   * the observer never fired on content shrinks (e.g. toggling a metric
   * off). The footer kept its stale height and `maxMetricsHeight` (used by
   * siblings) stayed too tall, leaving a blank gap below the metrics.
   *
   * After the fix: `metricsRef` is attached to an inner `<div>` that wraps
   * the grid, so the observed element reflects the natural content height.
   * Removing a metric shrinks the inner div, the observer fires, and the
   * synchronized max re-evaluates. The map (flex-1 in the panel) grows to
   * fill the freed space.
   */
  test("removing a metric makes the map grow (no whitespace below)", async ({
    page,
  }) => {
    await installStravaMock(page);
    await page.goto("/");
    await expect(page.getByText("Tu poster aparecerá aquí")).toBeVisible();

    await loadFirstActivity(page);

    const scope = page.locator("[data-poster-scope]");
    const map = scope.locator("canvas").first();
    const mapHeightBefore = (await map.boundingBox())!.height;
    const gapBefore = await readPanelBottomGap(page);
    expect(gapBefore).toBeLessThan(2);

    // Open the Métricas section, scope to slot 0, and uncheck the first two
    // visible metric checkboxes so the grid loses a row.
    const sidebar = page.locator("aside");
    const metricsSection = sidebar.locator("section", {
      hasText: "Métricas",
    });
    // Slot 0 is the first slot selector button inside the Métricas section.
    // The label is either "1" (no activity) or "1 · Ride".
    await metricsSection
      .getByRole("button", { name: /^1($|\s)/ })
      .click();

    const checkboxes = metricsSection.getByRole("checkbox").filter({
      hasNot: page.locator("[disabled]"),
    });
    // Remove two metrics. Two toggles are enough to drop a row in the 5-col
    // grid and free visible vertical space.
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Give the layout (and the height-sync recompute on removal) a chance to
    // settle.
    await page.waitForTimeout(400);

    const mapHeightAfter = (await map.boundingBox())!.height;
    const gapAfter = await readPanelBottomGap(page);

    // The map (which has flex-1) must have grown to fill the freed space.
    expect(mapHeightAfter).toBeGreaterThan(mapHeightBefore + 8);
    // And there must still be no whitespace below the metrics.
    expect(gapAfter).toBeLessThan(2);
  });
});
