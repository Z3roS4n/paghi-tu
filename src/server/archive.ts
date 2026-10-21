import "server-only";
import { type ArchiveEntry, normalize } from "@/lib/domain/archive";
import { COFOG_DIVISIONS } from "@/lib/domain/schemas";
import { formatDate } from "@/lib/format";
import { budgetLaws, getGovernment, governments, measures, parties, promises } from "./data";

const text = (...parts: (string | null | undefined)[]) => normalize(parts.filter(Boolean).join(" "));

export function archiveEntries(): ArchiveEntry[] {
  const partyName = new Map(parties.map((p) => [p.id, p.nome]));
  return [
    ...governments.map((g) => ({
      tipo: "governo" as const,
      titolo: g.nome,
      dettaglio: `${g.presidente} · ${formatDate(g.inizio)} – ${g.fine ? formatDate(g.fine) : "in carica"}`,
      href: `/governi/${g.id}`,
      data: g.inizio,
      testo: text(g.nome, g.presidente, g.maggioranza, g.tipo, g.inizio.slice(0, 4)),
    })),
    ...budgetLaws.map((l) => {
      const gov = l.governoProponenteId ? getGovernment(l.governoProponenteId) : undefined;
      return {
        tipo: "legge" as const,
        titolo: l.estremi,
        dettaglio: `${l.tipoAtto} · esercizio ${l.annoEsercizio}${gov ? ` · ${gov.nome}` : ""}`,
        href: `/leggi-di-bilancio#${l.id}`,
        data: String(l.annoInizio),
        testo: text(l.estremi, l.tipoAtto, l.tipoAttoOriginale, l.annoEsercizio, gov?.nome, gov?.presidente),
      };
    }),
    ...measures.map((m) => ({
      tipo: "misura" as const,
      titolo: m.titolo,
      dettaglio: `${m.attoIstitutivo} · ${m.governoTesto}`,
      href: `/misure#${m.id}`,
      data: String(m.annoAvvio),
      testo: text(m.titolo, m.attoIstitutivo, m.governoTesto, String(m.annoAvvio)),
    })),
    ...promises.map((p) => {
      const nome = partyName.get(p.partitoId) ?? p.partitoId;
      return {
        tipo: "promessa" as const,
        titolo: p.parafrasiNeutra,
        dettaglio: `${nome} · ${p.dichiarante} · ${formatDate(p.data)}`,
        href: `/promesse#${p.id}`,
        data: p.data,
        partito: { id: p.partitoId, nome },
        testo: text(p.parafrasiNeutra, p.testoLetterale, nome, p.dichiarante, COFOG_DIVISIONS[p.cofog]),
      };
    }),
  ];
}
