import { describe, expect, it } from "vitest";
import { constantEuro, lireToEuro, perCapita, shareOfGdp, toSeries } from "./money.ts";

// Valori di riferimento ricalcolati dal verificatore L2 sui file ufficiali
// (research/2026-10-20.normalizzazione-storica-lire-euro-inflazione-pil.md).
describe("normalizzazione: 1.000 miliardi di lire del 1985", () => {
  const eur = lireToEuro(1_000e9);

  it("converte al tasso fisso 1936,27", () => {
    expect(eur).toBeCloseTo(516_456_899.09, 2);
  });

  it("rivaluta in euro 2025 con l'indice FOI", () => {
    const foi = toSeries([
      { anno: 1985, valore: 1 },
      { anno: 2025, valore: 3.0106 },
    ]);
    expect(constantEuro(eur, 1985, 2025, foi) / 1e9).toBeCloseTo(1.555, 3);
  });

  it("calcola la quota di PIL", () => {
    expect(shareOfGdp(1, 200)).toBe(0.5);
  });

  it("calcola il pro capite", () => {
    expect(perCapita(1000, 4)).toBe(250);
  });

  it("rifiuta indici mancanti", () => {
    expect(() => constantEuro(1, 1900, 2025, toSeries([]))).toThrow(/1900/);
  });
});
