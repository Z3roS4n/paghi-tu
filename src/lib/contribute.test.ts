import { describe, expect, it } from "vitest";
import { correctionUrl } from "./contribute.ts";

describe("correctionUrl", () => {
  it("compila pagina e dato nel modulo di correzione", () => {
    const url = new URL(correctionUrl("/promesse#C27-PD-001", "C27-PD-001"));
    expect(url.pathname).toBe("/Z3roS4n/paghi-tu/issues/new");
    expect(url.searchParams.get("template")).toBe("correzione.yml");
    expect(url.searchParams.get("pagina")).toBe("https://paghi-tu.vercel.app/promesse#C27-PD-001");
    expect(url.searchParams.get("dato")).toBe("C27-PD-001");
  });

  it("senza dato usa la pagina nel titolo", () => {
    const url = new URL(correctionUrl("/spesa"));
    expect(url.searchParams.get("title")).toBe("Correzione: /spesa");
    expect(url.searchParams.has("dato")).toBe(false);
  });
});
