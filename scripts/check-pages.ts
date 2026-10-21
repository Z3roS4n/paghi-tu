// Controllo delle pagine generate da `next build`, prima di ogni pubblicazione della routine (D-018, D-022).
// Uso: node scripts/check-pages.ts [cartella, default .next/server/app]
// Guarda solo il testo visibile: i dati interni di React contengono `$undefined` anche quando la pagina è giusta.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? ".next/server/app";
const CLOSED_PANELS = /<details[^>]*>\s*<summary[^>]*>(?:Registro tecnico della verifica|Note di lavoro della ricerca)[\s\S]*?<\/details>/g;
const CHECKS = [
  ["numero non calcolato", /\b(?:NaN|undefined|Infinity)\b/g],
  ["nota interna", /V[12]✓|CONFERMATA|PERIMETRO|INFERENZA|(?<!agente )verificatore/g],
] as const;

const visibleText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(CLOSED_PANELS, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const pages = readdirSync(ROOT, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".html"));
if (!pages.length) {
  console.error(`Nessuna pagina in ${ROOT}: lancia prima npm run build`);
  process.exit(2);
}

let found = 0;
for (const page of pages) {
  const text = visibleText(readFileSync(join(ROOT, page), "utf8"));
  for (const [label, re] of CHECKS) {
    for (const m of text.matchAll(re)) {
      found++;
      console.log(`${page} — ${label}: «…${text.slice(Math.max(0, m.index - 60), m.index + 40).trim()}…»`);
    }
  }
}
console.log(`${pages.length} pagine controllate, ${found} problemi`);
process.exit(found ? 1 : 0);
