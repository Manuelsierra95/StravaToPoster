"use client";

import { Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePoster } from "@/components/poster-provider";
import {
  buildFilename,
  captureNodeAsPng,
  dataUrlToBlob,
  triggerBlobDownload,
  waitForMapsIdle,
} from "@/lib/poster-snapshot";
import { getTheme } from "@/lib/poster-themes";

type Status = "idle" | "capturing" | "error";

export function DownloadPosterButton() {
  const { activities, config, loadingBySlot, posterFrameRef, mapsBySlot } = usePoster();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filledSlots = activities
    .slice(0, config.activityCount)
    .filter((a) => a !== null).length;
  const anyLoading = Object.values(loadingBySlot).some(Boolean);
  const canCapture = filledSlots > 0 && !anyLoading && status !== "capturing";

  const handleClick = useCallback(async () => {
    const frame = posterFrameRef.current;
    if (!frame) return;

    const controller = new AbortController();
    setStatus("capturing");
    setErrorMessage(null);

    try {
      // Force a fresh paint on every map so the WebGL framebuffer is up to
      // date. Without this, a map with no pending tile requests would skip
      // rendering and the snapshot could capture a stale frame.
      for (const map of mapsBySlot.values()) {
        map.triggerRepaint();
      }
      await waitForMapsIdle(Array.from(mapsBySlot.values()));
      // One more frame so the just-triggered repaint lands before we read it.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const theme = getTheme(config.theme);
      const dataUrl = await captureNodeAsPng(frame, {
        pixelRatio: 2,
        backgroundColor: theme.poster.background,
        signal: controller.signal,
      });

      const blob = dataUrlToBlob(dataUrl);
      const filename = buildFilename(activities.find((a) => a !== null)?.name);
      const objectUrl = triggerBlobDownload(blob, filename);
      // Release the object URL after the browser has had a chance to start
      // the download. 5s is conservative; modern browsers fire it within
      // a few hundred ms.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

      setStatus("idle");
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudo exportar el poster",
      );
      setStatus("error");
    }
  }, [
    activities,
    config.theme,
    mapsBySlot,
    posterFrameRef,
  ]);

  useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => setStatus("idle"), 4000);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="default"
        size="lg"
        onClick={handleClick}
        // Workaround for a React 19 + `@base-ui/react/button` hydration
        // mismatch: when `disabled` is the boolean attribute on a native
        // <button>, SSR renders `disabled=""` but the client re-hydrates
        // it as `disabled={null}`, which trips a hydration warning. Setting
        // `focusableWhenDisabled` makes Base UI emit `aria-disabled`
        // (a string attribute) instead of `disabled` (a boolean), so
        // server and client agree on the rendered HTML. The Base UI click
        // handler still short-circuits when the button is "disabled",
        // and we mirror the `.group/button` disabled styles for the
        // `aria-disabled` attribute so the visual state stays consistent.
        focusableWhenDisabled
        disabled={!canCapture || undefined}
        aria-disabled={!canCapture || undefined}
        className="w-full aria-disabled:opacity-50 aria-disabled:pointer-events-none"
      >
        {status === "capturing" ? (
          <>
            <Loader2 className="animate-spin" />
            Exportando…
          </>
        ) : (
          <>
            <Download />
            Descargar PNG
          </>
        )}
      </Button>
      {status === "capturing" && (
        <p className="text-[0.65rem] text-muted-foreground">
          Renderizando a 2× — puede tardar unos segundos.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p className="text-[0.65rem] text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}