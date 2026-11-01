// I record tabellari già citati si mostrano senza ricalcolare o parafrasare i loro valori.
import { citableText, type AgentAnswer, type Index } from "./answer.ts";

const TABULAR = new Set(["governi", "legislature", "leggi-bilancio", "misure", "finanza-pubblica"]);

export function composeRecords(answer: AgentAnswer, index: Index): AgentAnswer {
  if (answer.astensione || !answer.citazioni.length) return answer;
  const docs = answer.citazioni.map((citation) => index.get(citation.id));
  if (docs.some((doc) => !doc || !TABULAR.has(doc.structData.dataset) && !doc.structData.dataset.startsWith("serie/"))) return answer;
  const present = docs.filter((doc) => doc !== undefined);
  const mixedBases = present.some((doc) => /Omogeneità delle basi: non_omogeneo\./.test(citableText(doc)));
  const sharedWarnings = new Set<string>();
  const text = present.map((doc) => {
    const value = citableText(doc).split("\n").filter((line) => {
      if (!/^(Livello di verifica|Spendere meno del tetto)/.test(line)) return true;
      if (sharedWarnings.has(line)) return false;
      sharedWarnings.add(line);
      return true;
    }).join("\n");
    // Un insieme che comprende basi non omogenee non permette un confronto percentuale.
    return mixedBases ? value.replace(/\s*\([^()\n]*\d[^()\n]*%[^()\n]*\)/g, "") : value;
  }).join("\n\n");
  return { ...answer, testo: text };
}
