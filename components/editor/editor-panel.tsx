"use client";

import { useState } from "react";

import { Separator } from "@/components/ui/separator";
import { DragAndDropProvider } from "@/components/ui/drag-and-drop";
import { usePoster } from "@/components/poster-provider";
import { StravaAuth } from "./strava-auth";
import { MultiActivityPicker } from "./multi-activity-picker";
import { SlotSelector } from "./slot-selector";
import { PosterOrientation } from "./poster-orientation";
import { RouteColorPicker } from "./route-color-picker";
import { ElevationChartControl } from "./elevation-chart-control";
import { MapStyleSelector } from "./map-style-selector";
import { MapTiltControl } from "./map-tilt-control";
import { MapLabelsControl } from "./map-labels-control";
import { MetricToggles } from "./metric-toggles";
import { FontPicker } from "./font-picker";
import { PosterBackground } from "./poster-background";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function useActiveSlot() {
  const { config } = usePoster();
  const [slot, setSlot] = useState(0);
  const max = config.activityCount - 1;
  if (slot > max) setSlot(max);
  return [Math.min(slot, max), setSlot] as const;
}

export function EditorPanel() {
  const [routeSlot, setRouteSlot] = useActiveSlot();
  const [chartSlot, setChartSlot] = useActiveSlot();
  const [mapSlot, setMapSlot] = useActiveSlot();
  const [metricSlot, setMetricSlot] = useActiveSlot();

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto border-border border-t bg-background p-5 lg:border-t-0 lg:border-l">
      <div>
        <h2 className="font-heading text-base font-bold">Configurar poster</h2>
        <p className="text-xs text-muted-foreground">
          Personaliza el recorrido, mapa y métricas.
        </p>
      </div>

      <Section title="Cuenta Strava">
        <StravaAuth />
      </Section>

      <Separator />

      <Section title="Actividades">
        <MultiActivityPicker />
      </Section>

      <Separator />

      <Section title="Formato">
        <PosterOrientation />
      </Section>

      <Separator />

      <Section title="Fondo">
        <PosterBackground />
      </Section>

      <Separator />

      <Section title="Tipografía">
        <FontPicker />
      </Section>

      <Separator />

      <Section title="Recorrido">
        <SlotSelector value={routeSlot} onChange={setRouteSlot} />
        <RouteColorPicker slot={routeSlot} />
      </Section>

      <Separator />

      <Section title="Gráfico">
        <SlotSelector value={chartSlot} onChange={setChartSlot} />
        <ElevationChartControl slot={chartSlot} />
      </Section>

      <Separator />

      <Section title="Mapa">
        <SlotSelector value={mapSlot} onChange={setMapSlot} />
        <MapStyleSelector slot={mapSlot} />
        <MapTiltControl slot={mapSlot} />
        <MapLabelsControl slot={mapSlot} />
      </Section>

      <Separator />

      <Section title="Métricas">
        <SlotSelector value={metricSlot} onChange={setMetricSlot} />
        <DragAndDropProvider>
          <MetricToggles slot={metricSlot} />
        </DragAndDropProvider>
      </Section>
    </aside>
  );
}