import { describe, expect, it } from "vitest";
import { findNumber, findValue, htmlToText, isWellFormedUrl, missingFragments, normalizeText } from "./testo.ts";

describe("normalizzazione del testo delle fonti", () => {
  it("toglie lo spazio prima della virgola e unifica apostrofi e virgolette", () => {
    // Caso reale: la pagina Lega di COR-0001 ha «giovanissimi ,» nell'HTML.
    expect(normalizeText("diffondendo tra i giovanissimi , in particolare")).toBe("diffondendo tra i giovanissimi, in particolare");
    expect(normalizeText("dell’istruzione “gratis”")).toBe(normalizeText("dell'istruzione \"gratis\""));
  });

  it("ricompone le parole spezzate a fine riga nei PDF", () => {
    expect(normalizeText("spesa pensio-\nnistica")).toBe("spesa pensionistica");
  });

  it("legge una citazione con tagli a pezzi", () => {
    const source = normalizeText("Poi, è necessaria una stretta per i coltelli, il cui uso si sta diffondendo. Altro testo. Ci saranno provvedimenti severi.");
    expect(missingFragments("«[…] è necessaria una stretta per i coltelli […] Ci saranno provvedimenti severi.»", source)).toEqual([]);
    expect(missingFragments("«è necessaria una stretta per i coltelli. Ci saranno provvedimenti severi.»", source)).not.toEqual([]);
  });

  it("estrae il testo da HTML con entità e da un attributo data-* JSON", () => {
    expect(normalizeText(htmlToText("<p>perch&eacute; <em>s&igrave;</em>&nbsp;ora</p><script>x=1</script>"))).toBe("perché sì ora");
    const page = JSON.stringify({ content: `<p>La gratuità ${"x".repeat(200)} retta universitaria</p>` }).replace(/"/g, "&quot;");
    expect(normalizeText(htmlToText(`<div id="app" data-page="${page}"></div>`))).toContain("retta universitaria");
  });
});

describe("ricerca dei numeri", () => {
  it("trova un importo in milioni scritto all'italiana, non dentro un numero più lungo", () => {
    expect(findNumber("previsti 18.550 milioni", 18_550_000_000, "euro")).toBe("18.550");
    expect(findNumber("previsti 118.550 milioni", 18_550_000_000, "euro")).toBeNull();
    expect(findNumber("previsti 18.550,7 milioni", 18_550_000_000, "euro")).toBeNull();
  });

  it("trova i milioni con due decimali fissi, ma non un decimale diverso", () => {
    // Relazione tecnica dell'assegno unico (AG 333, XVIII): «18.914,80 milioni di euro per l'anno 2025».
    expect(findNumber("18.914,80 milioni di euro per l'anno 2025", 18_914_800_000, "euro")).toBe("18.914,80");
    expect(findNumber("18.914,81 milioni", 18_914_800_000, "euro")).toBeNull();
  });

  it("accetta gli zeri decimali del CSV Eurostat e il valore assoluto di uno scostamento", () => {
    expect(findNumber("IT,1995,-71303.0,,", -71303)).toBe("-71303");
    expect(findNumber("minori spese per 10.271 milioni", -10_271_000_000, "euro")).toBe("10.271");
  });

  it("non accetta forme con meno di tre cifre", () => {
    expect(findNumber("6 anni", 6_100_000_000, "euro")).toBeNull();
  });

  it("trova le date ISO scritte per esteso", () => {
    expect(findValue(normalizeText("Roma, 1° dicembre 1982"), "1982-12-01")).not.toBeNull();
    expect(findValue(normalizeText("nominato il 10/12/1945"), "1945-12-10")).not.toBeNull();
  });
});

describe("URL delle fonti", () => {
  it("rifiuta un URL con l'etichetta dentro", () => {
    expect(isWellFormedUrl("https://bdp.camera.it/init/iter (Iter delle leggi 1948-1990)")).toBe(false);
    expect(isWellFormedUrl("https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1952-01-16;34")).toBe(true);
    expect(isWellFormedUrl("ftp://example.org/x")).toBe(false);
  });
});

describe("forme scritte degli importi e dei campi composti", () => {
  it("trova un importo con l'unità scritta e uno con i centesimi", async () => {
    const { findNumber, findDeclarant, findDeclaredCost } = await import("./testo.ts");
    expect(findNumber("un costo pari a circa 35 miliardi", 35_000_000_000, "euro")).toBe("35 miliardi");
    expect(findNumber("onere 131.558.610.980,03 €", 131_558_610_980, "euro")).toBe("131.558.610.980,03");
    expect(findNumber("ici 3.364.846.992,77", 3_364_846_993, "euro")).toBe("3.364.846.992,77");
    expect(findNumber("ici 3.364.846.992,27", 3_364_846_993, "euro")).toBeNull();
    expect(findNumber("erogati 4,5 miliardi", 4_529_138_051, "euro")).toBeNull();
    expect(findDeclarant("interviene guerra con torto e magi", "Guerra, Torto, Magi (firmatari)")).not.toBeNull();
    expect(findDeclarant("interviene guerra con torto", "Guerra, Torto, Magi (firmatari)")).toBeNull();
    expect(findDeclarant("la sinistra unita", "Alleanza Verdi e Sinistra")).toBeNull();
    expect(findDeclarant("ha detto schlein", "Elly Schlein")).toBe("schlein");
    expect(findNumber("spesa di 13,2 per cento", 13_200_000_000, "euro")).toBeNull();
    expect(findDeclaredCost(normalizeText("una misura a costo zero"), "nessun costo ('una misura a costo zero', dichiarato)")).not.toBeNull();
    expect(findDeclaredCost("mettere 8 mld sulla difesa", "8 mld (in scostamento di bilancio)")).toBe("8 mld");
  });
});
