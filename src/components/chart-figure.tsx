import { type ChartPoint, LineChart } from "./line-chart";

export function ChartFigure({
  title,
  note,
  source,
  points,
  unit,
  highlight,
}: {
  title: string;
  note?: string;
  source: string;
  points: ChartPoint[];
  unit: "euro" | "pct";
  highlight?: { from: number; to: number; label: string };
}) {
  return (
    <figure className="min-w-0">
      <figcaption>
        <h3 className="font-semibold">{title}</h3>
        {note ? <p className="mt-1 max-w-[65ch] text-sm text-ink-soft">{note}</p> : null}
      </figcaption>
      <div className="mt-4">
        <LineChart points={points} unit={unit} label={title} highlight={highlight} />
      </div>
      <p className="mt-2 text-xs text-ink-faint">{source}</p>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-soft hover:text-ink">Vedi i dati in tabella</summary>
        <div className="mt-3 max-h-80 overflow-y-auto border border-rule">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-paper-raised text-ink-faint">
              <tr>
                <th scope="col" className="px-3 py-2 font-normal">Periodo</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Valore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {points.toReversed().map((p) => (
                <tr key={p.x}>
                  <td className="tabular px-3 py-1.5">{p.label}</td>
                  <td className="tabular px-3 py-1.5 text-right">{p.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
