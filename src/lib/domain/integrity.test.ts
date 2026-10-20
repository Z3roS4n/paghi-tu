import { describe, expect, it } from "vitest";
import { z } from "zod";
import budgetLawsJson from "../../../data/leggi-bilancio.json";
import governmentsJson from "../../../data/governi.json";
import legislaturesJson from "../../../data/legislature.json";
import { BudgetLaw, Government, Legislature } from "./schemas.ts";

// Controlli automatici richiesti da D-010: chiavi esistenti, date coerenti, nessun buco.
const legislatures = z.array(Legislature).parse(legislaturesJson);
const governments = z.array(Government).parse(governmentsJson);
const budgetLaws = z.array(BudgetLaw).parse(budgetLawsJson);

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
});
