// Avvertenze dei record aggiunte dalla route (D6, proposta del 2026-10-25, da decidere con Giovanni;
// D-033): se un record citato porta un'avvertenza (dato NV, verifica parziale, tetto, proiezione,
// scostamento calcolato da Paghi Tu, confidenza bassa, consuntivo assente, rottura di serie, solo
// stesso trimestre, valore stimato), la risposta la riporta sempre, anche quando il modello la omette.
// Come D5: le frasi sono fisse o prese dal record, il modello non le scrive.
import type { IndexDocument } from "../ingest/export.ts";
import { citableText, type AgentAnswer, type Index } from "./answer.ts";

// Per ogni avvertenza: quando il record la porta e la frase che la risposta mostra (la riga del
// record stessa, se si legge bene da sola).
const WARNINGS: { when: RegExp; say: (line: string) => string }[] = [
  { when: /^Dato non verificato \(NV\)/, say: (l) => l },
  { when: /^Livello di verifica V2: verifica parziale\.$/, say: (l) => l },
  { when: /^Spendere meno del tetto non è un risparmio/, say: (l) => l },
  { when: /^Consuntivo \(proiezione\):/, say: () => "Il consuntivo è una proiezione, non un dato definitivo." },
  { when: /, calcolato da Paghi Tu\.$/, say: () => "Lo scostamento è calcolato da Paghi Tu, non dalla fonte." },
  { when: /Confidenza: [CD]\.$/, say: (l) => `Confidenza bassa (${/Confidenza: ([CD])\.$/.exec(l)?.[1]}) sul confronto.` },
  { when: /^Consuntivo: (?!.*\beuro\b)/, say: (l) => l.replace(/^Consuntivo: /, "Consuntivo ") },
  { when: /^Rottura di serie:/, say: (l) => l },
  { when: /stesso trimestre di un altro anno\.$/, say: (l) => l },
  { when: /\bOBS_STATUS=e\b/, say: () => "Il valore è una stima della fonte (ISTAT)." },
];

export function recordWarnings(d: IndexDocument): string[] {
  const out: string[] = [];
  for (const line of citableText(d).split("\n")) {
    for (const w of WARNINGS) if (w.when.test(line)) out.push(w.say(line));
  }
  return out;
}

// Le avvertenze dei record citati che il testo non contiene già, in coda, una per riga.
export function appendWarnings(answer: AgentAnswer, index: Index): AgentAnswer {
  if (answer.astensione) return answer;
  const missing = [
    ...new Set(answer.citazioni.flatMap((c) => {
      const d = index.get(c.id);
      return d ? recordWarnings(d) : [];
    })),
  ].filter((w) => !answer.testo.includes(w));
  if (!missing.length) return answer;
  return { ...answer, testo: `${answer.testo.trimEnd()}\n\n${missing.join("\n")}` };
}
