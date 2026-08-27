import { getFontEmbedCSS, toPng } from "html-to-image";
import type { Map as MapLibreMap } from "maplibre-gl";

export type CaptureOptions = {
  pixelRatio?: number;
  backgroundColor?: string;
  signal?: AbortSignal;
};

/**
 * Wait until every registered MapLibre map has finished rendering the
 * currently-pending frame (no in-flight tile/raster requests). Without this,
 * the snapshot may capture the map mid-load and export a partially grey
 * basemap.
 */
export async function waitForMapsIdle(maps: MapLibreMap[]): Promise<void> {
  await Promise.all(
    maps.map(
      (map) =>
        new Promise<void>((resolve) => {
          // `idle` fires when no more tiles are pending, so this covers
          // both the initial load and any subsequent style swap.
          map.once("idle", () => resolve());
        }),
    ),
  );
}

/**
 * Capture a DOM node as a PNG data URL.
 *
 * Uses `html-to-image`, which serializes the DOM via an SVG `<foreignObject>`
 * and renders to a 2D canvas. WebGL canvases (the MapLibre map) require
 * `preserveDrawingBuffer: true` on the map instance to be readable here.
 */
export async function captureNodeAsPng(
  node: HTMLElement,
  options: CaptureOptions = {},
): Promise<string> {
  const { pixelRatio = 2, backgroundColor, signal } = options;

  // Wait for all web fonts so embedded text uses the right family.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const fontEmbedCSS = await getFontEmbedCSS(node);

  const htmlToImageOptions = {
    pixelRatio,
    cacheBust: true,
    fontEmbedCSS,
    ...(backgroundColor ? { backgroundColor } : {}),
    filter: (domNode: Element) => {
      // Strip live-only UI that shouldn't appear in the exported poster:
      // MapLibre controls and the loading spinner overlay.
      if (!(domNode instanceof HTMLElement)) return true;
      if (domNode.classList?.contains("maplibregl-ctrl")) return false;
      if (domNode.classList?.contains("maplibregl-ctrl-attrib")) return false;
      return true;
    },
  };

  if (signal) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  }

  return toPng(node, htmlToImageOptions);
}

/** Convert a data URL string to a Blob (so we can release the data URL memory). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",", 2);
  const mimeMatch = /data:([^;]+)(?:;base64)?/.exec(meta ?? "");
  const mime = mimeMatch?.[1] ?? "image/png";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Trigger a file download in the browser from an in-memory Blob. Returns the
 * object URL so the caller can revoke it after the click is dispatched.
 */
export function triggerBlobDownload(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return url;
}

/**
 * Lowercase, ASCII-only filename-safe slug. Falls back to "poster" when the
 * input has no usable characters.
 */
export function slugify(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return normalized || "poster";
}

/** `YYYY-MM-DD-HHmm` in local time. */
export function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") +
    "-" +
    [pad(date.getHours()), pad(date.getMinutes())].join("");
}

export function buildFilename(activityName: string | null | undefined, date: Date = new Date()): string {
  return `${slugify(activityName ?? "") || "poster"}-${formatTimestamp(date)}.png`;
}