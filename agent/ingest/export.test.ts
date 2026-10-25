import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { CampaignPromise, Measure, PublicFinance, Series } from "../../src/lib/domain/schemas.ts";
import type { GoldenCase } from "../evals/golden-set.ts";
import { findDeclarant, findValue, normalizeText } from "../evals/testo.ts";
import { IndexDocument, NV_OPENING, buildDocuments, sha256, toJsonl, type ExportInput, type IndexDocument as Doc } from "./export.ts";
import { loadSiteData } from "./load.ts";

let input: ExportInput;
let result: ReturnType<typeof buildDocuments>;
let cases: GoldenCase[];
const key = (dataset: string, record: string) => `${dataset}|${record}`;

beforeAll(async () => {
  input = await loadSiteData();
  result = buildDocuments(input);
  cases = (await readFile("agent/evals/domande.jsonl", "utf8")).trim().split("\n").map((l) => JSON.parse(l) as GoldenCase);
});

describe("export per l'indice dell'agente (fase 1)", () => {
  it("1.2 è deterministico: stesso input, stessi byte", () => {
    expect(sha256(toJsonl(buildDocuments(input).documents))).toBe(sha256(toJsonl(result.documents)));
  });

  it("1.2 il manifest committato è allineato all'export", async () => {
    const manifest = z
      .object({ sha256: z.string(), esclusi: z.array(z.unknown()), nomiConCifre: z.array(z.string()) })
      .parse(JSON.parse(await readFile("agent/ingest/manifest.json", "utf8")));
    expect(manifest.sha256).toBe(sha256(toJsonl(result.documents)));
    expect(manifest.esclusi).toEqual(result.excluded);
    expect(manifest.nomiConCifre).toEqual(result.nomiConCifre);
  });

  it("1.3 ogni documento rispetta lo schema e ha un id unico", () => {
    for (const d of result.documents) IndexDocument.parse(d);
    const ids = result.documents.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const keys = result.documents.map((d) => key(d.structData.dataset, d.structData.record));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("1.4 per ogni dataset: documenti esportati = record pubblicati meno gli esclusi", () => {
    const finance = PublicFinance.parse(input.finanzaPubblica);
    const published: Record<string, number> = {
      governi: (input.governi as unknown[]).length,
      legislature: (input.legislature as unknown[]).length,
      "leggi-bilancio": (input.leggiBilancio as unknown[]).length,
      misure: z.array(Measure).parse(input.misure).flatMap((m) => m.confronti).length,
      "finanza-pubblica":
        finance.conti.length + finance.trimestri.length + finance.funzioni.length + finance.debitoMensile.length + finance.debitoPil.length + 3,
      promesse: z.array(CampaignPromise).parse(input.promesse).length,
      correzioni: (input.correzioni as unknown[]).length,
    };
    for (const s of Object.values(input.serie).map((x) => Series.parse(x))) published[`serie/${s.id}`] = s.punti.length;

    const count = (list: { dataset: string }[], ds: string) => list.filter((x) => x.dataset === ds).length;
    const exported = result.documents.map((d) => d.structData);
    for (const [ds, n] of Object.entries(published)) {
      expect({ ds, n: count(exported, ds) + count(result.excluded, ds) }).toEqual({ ds, n });
    }
    expect(new Set(exported.map((d) => d.dataset))).toEqual(new Set(Object.keys(published)));
  });

  it("1.1 nessun documento cita Wikipedia o una fonte «con_permesso»", () => {
    const urls = result.documents.flatMap((d) => d.structData.fonte_url);
    expect(urls.filter((u) => /wikipedia\.org|upbilancio\.it|pagellapolitica\.it/.test(new URL(u).hostname))).toEqual([]);
    for (const e of result.excluded) expect(e.motivo).not.toBe("");
  });

  it("1.5 i record NV entrano marcati: livello NV e testo che si apre con la frase NV", () => {
    const nv = result.documents.filter((d) => d.structData.livello_verifica === "NV");
    expect(nv.length).toBeGreaterThan(0);
    for (const d of nv) expect(d.structData.testo.startsWith(NV_OPENING)).toBe(true);
    for (const d of result.documents.filter((x) => x.structData.livello_verifica !== "NV")) {
      expect(d.structData.testo.includes(NV_OPENING)).toBe(false);
    }
  });

  it("ogni citazione attesa del golden set è esportata, oppure esclusa con un motivo", () => {
    const exported = new Set(result.documents.map((d) => key(d.structData.dataset, d.structData.record)));
    const excluded = new Set(result.excluded.map((e) => key(e.dataset, e.record)));
    const missing = cases
      .flatMap((c) => c.citazioniAttese.map((cit) => key(cit.dataset, cit.record)))
      .filter((k) => !exported.has(k) && !excluded.has(k));
    expect([...new Set(missing)]).toEqual([]);
  });

  it("ogni valore atteso del golden set sta nel testo del documento citato", () => {
    const byKey = new Map<string, Doc>(result.documents.map((d) => [key(d.structData.dataset, d.structData.record), d]));
    const problems: string[] = [];
    for (const c of cases) {
      const docs = c.citazioniAttese.map((cit) => byKey.get(key(cit.dataset, cit.record))).filter((d): d is Doc => Boolean(d));
      if (docs.length !== c.citazioniAttese.length) continue;
      const text = normalizeText(docs.map((d) => d.structData.testo).join("\n"));
      for (const v of c.valoriAttesi) {
        if (v.valore === null) continue;
        const found =
          v.campo === "dichiarante" && typeof v.valore === "string"
            ? findDeclarant(text, v.valore)
            : (findValue(text, v.valore, v.unita) ?? (typeof v.valore === "string" && text.includes(normalizeText(v.valore)) ? v.valore : null));
        if (!found) problems.push(`${c.id}|${v.campo}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
