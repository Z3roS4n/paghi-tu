"use client";

import { useState } from "react";
import { SeriesChart, type SeriesChartProps } from "./series-chart";
import { Segmented } from "./segmented";

export type ChartView = { id: string; label: string; title: string; chart: SeriesChartProps };

export function ChartViews({ views, note }: { views: ChartView[]; note?: React.ReactNode }) {
  const [id, setId] = useState(views[0].id);
  const view = views.find((v) => v.id === id) ?? views[0];
  return (
    <>
      <figcaption className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="font-sans text-[15.5px] font-bold tracking-normal">{view.title}</h3>
          {note ? <div className="mt-1 max-w-[65ch] text-sm text-ink-soft">{note}</div> : null}
        </div>
        <Segmented label="Unità di misura" options={views.map((v) => ({ id: v.id, label: v.label }))} value={id} onChange={setId} />
      </figcaption>
      <div className="mt-2">
        <SeriesChart key={view.id} {...view.chart} />
      </div>
    </>
  );
}
