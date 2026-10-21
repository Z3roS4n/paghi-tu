import { formatChartValue } from "@/lib/chart";
import { ChartViews, type ChartView } from "./charts/chart-views";
import { SeriesChart, type SeriesChartProps } from "./charts/series-chart";

type Common = { note?: React.ReactNode; source: React.ReactNode; className?: string };

/**
 * Grafico con titolo, nota, fonte e tabella dei dati sempre disponibile. Con `views` mostra un
 * selettore (per esempio euro di oggi / % del PIL) che cambia le serie, non il periodo.
 */
export function ChartFigure(props: Common & ({ title: string; chart: SeriesChartProps } | { views: ChartView[] })) {
  const views: ChartView[] = "views" in props ? props.views : [{ id: "unica", label: props.title, title: props.title, chart: props.chart }];
  return (
    <figure className={`chart-frame m-0 min-w-0 rounded-card bg-paper-raised px-3.5 pt-4 pb-3.5 md:px-5 md:pt-5 ${props.className ?? ""}`}>
      {"views" in props ? (
        <ChartViews views={props.views} note={props.note} />
      ) : (
        <>
          <figcaption>
            <h3 className="font-sans text-[15.5px] font-bold tracking-normal">{props.title}</h3>
            {props.note ? <div className="mt-1 max-w-[65ch] text-sm text-ink-soft">{props.note}</div> : null}
          </figcaption>
          <div className="mt-2">
            <SeriesChart {...props.chart} />
          </div>
        </>
      )}
      <p className="mt-2 text-[13.5px] leading-normal text-ink-faint">{props.source}</p>
      <details className="mt-2 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center text-ink-soft hover:text-ink">Vedi i dati in tabella</summary>
        <div className="mt-1 max-h-80 overflow-auto rounded-ctl border border-rule">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-paper-raised text-ink-faint">
              <tr>
                <th scope="col" className="px-3 py-2 font-normal">Anno</th>
                {views.flatMap((v) =>
                  v.chart.series.map((s) => (
                    <th key={`${v.id}-${s.id}`} scope="col" className="px-3 py-2 text-right font-normal">
                      {s.name}
                      {views.length > 1 ? `, ${v.label.toLowerCase()}` : ""}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {views[0].chart.years
                .map((year, i) => ({ year, i }))
                .toReversed()
                .map(({ year, i }) => (
                  <tr key={year}>
                    <td className="tabular px-3 py-1.5">{year}</td>
                    {views.flatMap((v) =>
                      v.chart.series.map((s) => {
                        const val = s.values[i];
                        const est = s.estimatedUntil !== undefined && i <= s.estimatedUntil;
                        return (
                          <td key={`${v.id}-${s.id}`} className="tabular px-3 py-1.5 text-right">
                            {val === null ? "n.d." : `${formatChartValue(val, v.chart.unit, "full")}${est ? "*" : ""}`}
                          </td>
                        );
                      }),
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
          {views.some((v) => v.chart.series.some((s) => s.estimatedUntil !== undefined)) ? (
            <p className="px-3 py-2 text-xs text-ink-faint">* nostro calcolo</p>
          ) : null}
        </div>
      </details>
    </figure>
  );
}
