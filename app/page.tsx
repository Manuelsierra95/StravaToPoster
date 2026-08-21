import { Suspense } from "react";

import { EditorPanel } from "@/components/editor/editor-panel";
import { Poster } from "@/components/poster/poster";
import { MapAttribution } from "@/components/poster/map-attribution";
import { PosterProvider } from "@/components/poster-provider";

// Validate that the static shell of this route is instant across every entry
// point shared layout. The page itself is fully static (no cookies/headers),
// so the validation acts as a regression guard as the app grows.
export const unstable_instant = { prefetch: "static" };

function EditorSkeleton() {
  return (
    <aside
      aria-hidden
      className="bg-muted/30 hidden flex-col gap-5 border-border border-t p-5 lg:flex lg:border-t-0 lg:border-l lg:w-[360px]"
    >
      <div className="bg-muted h-8 w-40 rounded" />
      <div className="bg-muted h-px w-full" />
      <div className="bg-muted h-4 w-32 rounded" />
    </aside>
  );
}

export default function Page() {
  return (
    <PosterProvider>
      <div className="flex h-svh flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
          <main className="min-h-0 overflow-hidden">
            <Poster />
          </main>
          <Suspense fallback={<EditorSkeleton />}>
            <EditorPanel />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <MapAttribution />
        </Suspense>
      </div>
    </PosterProvider>
  );
}
