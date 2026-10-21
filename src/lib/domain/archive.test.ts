import { describe, expect, it } from "vitest";
import { type ArchiveEntry, normalize, searchArchive } from "./archive.ts";

const entry = (over: Partial<ArchiveEntry>): ArchiveEntry => ({
  tipo: "promessa",
  titolo: "",
  dettaglio: "",
  href: "/x",
  data: "2026-01-01",
  testo: "",
  ...over,
});

describe("ricerca nell'archivio", () => {
  it("ignora accenti, maiuscole e punteggiatura", () => {
    expect(normalize("Sanità, PIÙ  Città!")).toBe("sanita piu citta");
  });

  it("richiede tutte le parole e mette prima i più recenti", () => {
    const entries = [
      entry({ href: "/a", data: "2025-01-01", testo: normalize("pensioni quota 100") }),
      entry({ href: "/b", data: "2026-05-01", testo: normalize("pensioni minime") }),
      entry({ href: "/c", data: "2026-06-01", testo: normalize("sanità") }),
    ];
    expect(searchArchive(entries, "Pensioni", { tipo: null, partito: null }).map((e) => e.href)).toEqual(["/b", "/a"]);
    expect(searchArchive(entries, "pensioni quota", { tipo: null, partito: null }).map((e) => e.href)).toEqual(["/a"]);
  });

  it("filtra per tipo e per partito", () => {
    const entries = [
      entry({ href: "/g", tipo: "governo" }),
      entry({ href: "/p1", partito: { id: "PD", nome: "Partito Democratico" } }),
      entry({ href: "/p2", partito: { id: "FDI", nome: "Fratelli d'Italia" } }),
    ];
    expect(searchArchive(entries, "", { tipo: "governo", partito: null }).map((e) => e.href)).toEqual(["/g"]);
    expect(searchArchive(entries, "", { tipo: "promessa", partito: "FDI" }).map((e) => e.href)).toEqual(["/p2"]);
  });
});
