export const REPO_URL = "https://github.com/Z3roS4n/paghi-tu";
export const SITE_URL = "https://www.paghitu.it";

// Apre il modulo «Correzione» del repo con la pagina (e il dato, se c'è) già compilati.
export function correctionUrl(pagina: string, dato?: string) {
  const q = new URLSearchParams({
    template: "correzione.yml",
    title: `Correzione: ${dato ?? pagina}`,
    pagina: `${SITE_URL}${pagina}`,
  });
  if (dato) q.set("dato", dato);
  return `${REPO_URL}/issues/new?${q}`;
}
