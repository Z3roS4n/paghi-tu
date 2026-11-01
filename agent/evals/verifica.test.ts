import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCsvRecords } from "../../src/lib/csv.ts";
import type { GoldenCase } from "./golden-set.ts";
import { isWellFormedUrl } from "./testo.ts";

// Controlli deterministici fra il golden set e le sue fonti. Non vanno in rete: leggono le copie
// in data/raw/ e il registro verifica-fonti.json scritto da `npm run evals:verify`.
const domandeText = readFileSync("agent/evals/domande.jsonl", "utf8");
const cases: GoldenCase[] = domandeText.trim().split("\n").map((l) => JSON.parse(l));
const read = (path: string) => readFileSync(path, "utf8");

type Ledger = {
  domandeSha256: string;
  verificatoIl: string;
  fonti: { url: string; esito: "ok" | "ko"; via: "diretto" | "archivio" }[];
  casi: { id: string; verbatim: { trovato: boolean } | null; valori: { campo: string; esito: string; addendiNonTrovati?: number[] }[] }[];
};
type Exceptions = Record<"fonti" | "citazioni" | "campi" | "valori", Record<string, string>> & {
  somme: Record<string, { ragione: string; addendi: number[] }>;
};
const ledger: Ledger = JSON.parse(read("agent/evals/verifica-fonti.json"));
const exceptions: Exceptions = JSON.parse(read("agent/evals/eccezioni-fonti.json"));

describe("URL delle citazioni attese", () => {
  it("sono tutti ben formati", () => {
    const bad = cases.flatMap((c) => c.citazioniAttese.flatMap((x) => x.urlAccettati.filter((u) => !isWellFormedUrl(u)).map((u) => `${c.id} ${u}`)));
    expect(bad).toEqual([]);
  });
});

describe("finanza pubblica contro le copie delle fonti in data/raw", () => {
  const manifest: { file: string; scaricato: string; sha256: string }[] = JSON.parse(read("data/raw/manifest.json"));

  // Eurostat risponde con a capo CRLF e l'impronta del manifest è su quei byte; git li salva in LF
  // (.gitattributes text=auto). Vale quindi l'impronta del file così com'è o con gli a capo CRLF.
  it("ogni copia ha l'impronta scritta nel manifest", () => {
    const sha = (s: string) => createHash("sha256").update(s).digest("hex");
    const changed = manifest.filter((m) => {
      const text = read(`data/raw/${m.file}`);
      return sha(text) !== m.sha256 && sha(text.replace(/\n/g, "\r\n")) !== m.sha256;
    });
    expect(changed.map((m) => m.file)).toEqual([]);
  });

  it("finanza-pubblica.json viene dallo stesso scaricamento del manifest", () => {
    const finance = JSON.parse(read("data/finanza-pubblica.json")) as { scaricato: string };
    expect([...new Set(manifest.map((m) => m.scaricato))]).toEqual([finance.scaricato]);
  });

  const csv = (file: string, delimiter?: string) => parseCsvRecords(read(`data/raw/${file}`), delimiter);
  const files = {
    main: csv("eurostat/gov_10a_main.csv"),
    exp: csv("eurostat/gov_10a_exp.csv"),
    edp: csv("eurostat/gov_10dd_edpt1.csv"),
    quarterly: csv("eurostat/gov_10q_ggnfa.csv"),
    euMain: csv("eurostat/ue_gov_10a_main.csv"),
    euExp: csv("eurostat/ue_gov_10a_exp.csv"),
    euEdp: csv("eurostat/ue_gov_10dd_edpt1.csv"),
    bdi: csv("bancaditalia/TCCE0325.csv", ";"),
  };
  const ITEM: Record<string, string> = { spesa: "TE", entrate: "TR", saldo: "B9", interessi: "D41PAY" };

  // «spesa 2009», «spesa 2026-Q2»: il periodo scritto nel campo (non «EU27_2020», che è un paese).
  const campoPeriod = (campo: string) => campo.match(/ (\d{4}(?:-Q\d)?)$/)?.[1];

  // Ogni cella si cerca con la sua chiave completa (tavola, unità, voce, paese, periodo): deve esserci una riga sola.
  function cells(record: string, campo: string): string[] {
    const [section, key, year] = record.split("/");
    const period = campoPeriod(campo) ?? (section === "confrontoUe" ? year : key);
    const name = campo.replace(/ \d{4}(?:-Q\d)?$/, "");
    const pick = (rows: Record<string, string>[], where: Record<string, string>) =>
      rows.filter((r) => Object.entries({ ...where, TIME_PERIOD: period }).every(([k, v]) => r[k] === v)).map((r) => r.OBS_VALUE);
    switch (section) {
      case "conti": {
        const [unit, item] = name.startsWith("pil.") ? ["PC_GDP", name.slice(4)] : ["MIO_NAC", name];
        return pick(files.main, { unit, na_item: ITEM[item], geo: "IT" });
      }
      case "trimestri":
        return pick(files.quarterly, { unit: "MIO_EUR", na_item: ITEM[name], geo: "IT" });
      case "funzioni":
        return pick(files.exp, { unit: "MIO_NAC", cofog99: name, geo: "IT" });
      case "debitoPil":
        return pick(files.edp, { unit: "PC_GDP", geo: "IT" });
      case "debitoMensile": {
        const [col] = Object.keys(files.bdi[0]).filter((k) => k.includes(".MGD.SBI3"));
        return files.bdi.filter((r) => r.DATA_OSS.startsWith(key.replace("-", "/"))).map((r) => r[col].replace(",", "."));
      }
      case "confrontoUe": {
        const [geo, item] = name.split(" ");
        if (key === "funzioni") return pick(files.euExp, { unit: "PC_GDP", cofog99: item, geo });
        if (key === "conti") return pick(files.euMain, { unit: "PC_GDP", na_item: ITEM[item], geo });
        if (key === "debito") return pick(files.euEdp, { unit: "PC_GDP", geo });
      }
    }
    throw new Error(`sezione o voce senza riscontro: ${record} ${campo}`);
  }

  it("ogni valore atteso è la cella corrispondente della fonte scaricata", () => {
    const problems: string[] = [];
    for (const c of cases.filter((x) => x.citazioniAttese.some((cit) => cit.dataset === "finanza-pubblica"))) {
      const records = c.citazioniAttese.filter((cit) => cit.dataset === "finanza-pubblica").map((cit) => cit.record);
      for (const v of c.valoriAttesi) {
        // Un campo con il periodo si riscontra solo sul record di quel periodo.
        const p = campoPeriod(v.campo);
        const found = records.filter((r) => !p || r.split("/")[1] === p).flatMap((r) => cells(r, v.campo).map((x) => `${r}: ${x}`));
        const ok = found.filter((f) => Number(f.split(": ")[1]) === v.valore);
        if (ok.length !== 1) problems.push(`${c.id} ${v.campo}=${v.valore}: celle ${JSON.stringify(found)}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("scostamenti delle misure", () => {
  it("sono consuntivo meno previsto, e la percentuale è sullo stesso previsto", () => {
    const problems: string[] = [];
    for (const c of cases.filter((x) => x.valoriAttesi.some((v) => v.campo === "scostamento"))) {
      const val = (campo: string) => c.valoriAttesi.find((v) => v.campo === campo)?.valore as number | undefined;
      const base = val("previsto") ?? val("tetto di spesa");
      const done = val("consuntivo");
      const diff = val("scostamento");
      const pct = val("scostamento %");
      if (base === undefined || done === undefined || done - base !== diff) problems.push(`${c.id}: ${done} − ${base} ≠ ${diff}`);
      if (pct !== undefined && base !== undefined && Math.abs((diff! / base) * 100 - pct) > 1e-9) problems.push(`${c.id}: ${pct} % ≠ ${diff}/${base}`);
    }
    expect(problems).toEqual([]);
  });
});

describe("riscontro con le fonti online (verifica-fonti.json)", () => {
  it("il registro è stato scritto per questa versione del golden set", () => {
    // Se fallisce: npm run evals:verify, poi si ricontrolla il registro.
    expect(ledger.domandeSha256).toBe(createHash("sha256").update(domandeText).digest("hex"));
  });

  it("ogni URL atteso è stato letto, direttamente o dalla copia d'archivio del record", () => {
    const expected = [...new Set(cases.flatMap((c) => c.citazioniAttese.flatMap((x) => x.urlAccettati)))].toSorted();
    expect(ledger.fonti.map((s) => s.url).toSorted()).toEqual(expected);
    const ko = ledger.fonti.filter((s) => s.esito === "ko" && !exceptions.fonti[s.url]).map((s) => s.url);
    expect(ko).toEqual([]);
  });

  it("ogni citazione verbatim si ritrova parola per parola nella fonte", () => {
    const missing = ledger.casi.filter((c) => c.verbatim && !c.verbatim.trovato && !exceptions.citazioni[c.id]).map((c) => c.id);
    expect(missing).toEqual([]);
  });

  it("ogni valore atteso è nella fonte, nelle copie in data/raw o ha una ragione scritta", () => {
    const missing = ledger.casi.flatMap((c) =>
      c.valori
        .filter((v) => v.esito === "non_trovato" && !exceptions.campi[v.campo] && !exceptions.valori[`${c.id}|${v.campo}`])
        .map((v) => `${c.id}|${v.campo}`),
    );
    expect(missing).toEqual([]);
  });

  it("ogni somma dichiarata torna al valore atteso, con tutti gli addendi trovati nella fonte", () => {
    const problems: string[] = [];
    for (const [key, sum] of Object.entries(exceptions.somme)) {
      const [id, campo] = key.split("|");
      const expected = cases.find((c) => c.id === id)?.valoriAttesi.find((v) => v.campo === campo)?.valore;
      const total = sum.addendi.reduce((a, b) => a + b, 0);
      if (total !== expected) problems.push(`${key}: somma ${total} ≠ ${expected}`);
      const result = ledger.casi.find((c) => c.id === id)?.valori.find((v) => v.campo === campo);
      if (result?.esito !== "somma_di_addendi_trovati") problems.push(`${key}: ${result?.esito} ${JSON.stringify(result?.addendiNonTrovati ?? [])}`);
    }
    expect(problems).toEqual([]);
  });

  it("nessuna eccezione resta scritta dopo che il problema è sparito", () => {
    const koUrls = new Set(ledger.fonti.filter((s) => s.esito === "ko").map((s) => s.url));
    const noVerbatim = new Set(ledger.casi.filter((c) => c.verbatim && !c.verbatim.trovato).map((c) => c.id));
    const notFound = ledger.casi.flatMap((c) => c.valori.filter((v) => v.esito === "non_trovato").map((v) => ({ id: c.id, campo: v.campo })));
    const stale = [
      ...Object.keys(exceptions.fonti).filter((u) => !koUrls.has(u)),
      ...Object.keys(exceptions.citazioni).filter((id) => !noVerbatim.has(id)),
      ...Object.keys(exceptions.campi).filter((campo) => !notFound.some((n) => n.campo === campo)),
      ...Object.keys(exceptions.valori).filter((k) => !notFound.some((n) => `${n.id}|${n.campo}` === k) || exceptions.campi[k.split("|")[1]]),
    ];
    expect(stale).toEqual([]);
  });
});

describe("copie primarie archiviate", () => {
  it("ogni copia conserva impronta, URL e prova della lettura originale riuscita", () => {
    const archived = JSON.parse(read("agent/evals/fonti-archiviate.json")) as Record<string, {
      file: string; sha256: string; verificatoIl: string;
      letturaOriginale: { url: string; esito: string; http: number };
    }>;
    for (const [url, source] of Object.entries(archived)) {
      expect(createHash("sha256").update(readFileSync(source.file)).digest("hex")).toBe(source.sha256);
      expect(source.letturaOriginale).toMatchObject({ url, esito: "ok", http: 200 });
      expect(source.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
