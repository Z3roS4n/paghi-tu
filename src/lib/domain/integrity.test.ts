import { describe, expect, it } from "vitest";
import { z } from "zod";
import budgetLawsJson from "../../../data/leggi-bilancio.json";
import governmentsJson from "../../../data/governi.json";
import legislaturesJson from "../../../data/legislature.json";
import legalActsJson from "../../../data/atti.json";
import legalActsStatusJson from "../../../data/atti-stato.json";
import promisesJson from "../../../data/promesse.json";
import { BudgetLaw, CampaignPromise, Government, LegalAct, LegalActsStatus, Legislature } from "./schemas.ts";

// Controlli automatici richiesti da D-010: chiavi esistenti, date coerenti, nessun buco.
const legislatures = z.array(Legislature).parse(legislaturesJson);
const governments = z.array(Government).parse(governmentsJson);
const budgetLaws = z.array(BudgetLaw).parse(budgetLawsJson);
const legalActs = z.array(LegalAct).parse(legalActsJson);
const legalActsStatus = LegalActsStatus.parse(legalActsStatusJson);
const promises = z.array(CampaignPromise).parse(promisesJson);

describe("integrità dei dataset", () => {
  it("ogni governo appartiene a una legislatura esistente", () => {
    const ids = new Set(legislatures.map((l) => l.id));
    expect(governments.filter((g) => !ids.has(g.legislaturaId)).map((g) => g.nome)).toEqual([]);
  });

  it("gli id dei governi sono unici", () => {
    expect(new Set(governments.map((g) => g.id)).size).toBe(governments.length);
  });

  it("i governi si susseguono senza sovrapposizioni", () => {
    const sorted = governments.toSorted((a, b) => a.ordine - b.ordine);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      expect(prev.fine, prev.nome).not.toBeNull();
      expect(prev.fine! <= sorted[i].inizio, `${prev.nome} → ${sorted[i].nome}`).toBe(true);
    }
  });

  it("solo l'ultimo governo è in carica", () => {
    expect(governments.filter((g) => g.fine === null).map((g) => g.nome)).toEqual(["Governo Meloni"]);
  });

  it("ogni legge di bilancio collegata punta a un governo esistente", () => {
    const ids = new Set(governments.map((g) => g.id));
    const broken = budgetLaws.filter((l) => l.governoProponenteId && !ids.has(l.governoProponenteId));
    expect(broken.map((l) => l.id)).toEqual([]);
  });

  it("il governo proponente era in carica prima dell'anno di esercizio", () => {
    const byId = new Map(governments.map((g) => [g.id, g]));
    const late = budgetLaws.filter((l) => {
      const g = l.governoProponenteId ? byId.get(l.governoProponenteId) : undefined;
      return g !== undefined && Number(g.inizio.slice(0, 4)) > l.annoInizio;
    });
    expect(late.map((l) => l.id)).toEqual([]);
  });

  it("gli id delle leggi di bilancio sono unici", () => {
    expect(new Set(budgetLaws.map((l) => l.id)).size).toBe(budgetLaws.length);
  });

  it("ogni atto punta a un governo in carica alla data dell'atto", () => {
    const byId = new Map(governments.map((g) => [g.id, g]));
    const broken = legalActs.filter((a) => {
      const g = byId.get(a.governoId);
      return !g || a.data < g.inizio || (g.fine !== null && a.data > g.fine);
    });
    expect(broken.map((a) => a.id)).toEqual([]);
  });

  it("gli id di atti e misure sono unici e le misure stanno sotto il loro atto", () => {
    const measureIds = legalActs.flatMap((a) => a.misure.map((m) => m.id));
    expect(new Set(legalActs.map((a) => a.id)).size).toBe(legalActs.length);
    expect(new Set(measureIds).size).toBe(measureIds.length);
    expect(legalActs.flatMap((a) => a.misure.filter((m) => !m.id.startsWith(`${a.id}-m`)).map((m) => m.id))).toEqual([]);
  });

  it("nessun atto entra in vigore prima di uscire in Gazzetta", () => {
    expect(legalActs.filter((a) => a.inVigoreDal < a.gazzetta.data).map((a) => a.id)).toEqual([]);
  });

  it("ogni atto è uscito in Gazzetta nel periodo dichiarato come censito", () => {
    const { dal, al, obiettivo } = legalActsStatus;
    expect(obiettivo <= dal && dal <= al).toBe(true);
    expect(legalActs.filter((a) => a.gazzetta.data < dal || a.gazzetta.data > al).map((a) => a.id)).toEqual([]);
  });

  it("ogni promessa pubblicata ha l'effetto sui conti classificato (D-030)", () => {
    expect(promises.filter((p) => p.effettoConti === null).map((p) => p.id)).toEqual([]);
  });

  it("una promessa ribadita resta dello stesso partito e non precede l'originale (D-031)", () => {
    const published = new Set(promises.map((p) => p.id));
    const wrong = promises.flatMap((p) =>
      p.ribadita.filter((r) => r.id.split("-")[1] !== p.partitoId || r.data < p.data || published.has(r.id)).map((r) => r.id),
    );
    expect(wrong).toEqual([]);
  });
});
