import "server-only";
import { LEGAL_ACT_TYPE } from "@/lib/domain/acts";
import { type ArchiveEntry, normalize } from "@/lib/domain/archive";
import { COFOG_DIVISIONS } from "@/lib/domain/schemas";
import { formatDate } from "@/lib/format";
import { budgetLaws, getGovernment, governments, legalActs, measures, parties, promises } from "./data";

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
    ...legalActs.map((a) => ({
      tipo: "atto" as const,
      titolo: a.titolo,
      dettaglio: `${LEGAL_ACT_TYPE[a.tipo]} n. ${a.numero} del ${formatDate(a.data)} · ${getGovernment(a.governoId)?.nome ?? ""}`,
      href: `/atti#${a.id}`,
      data: a.data,
      testo: text(a.titolo, a.titoloUfficiale, LEGAL_ACT_TYPE[a.tipo], String(a.numero), a.data.slice(0, 4), ...a.misure.map((m) => m.descrizione)),
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
        testo: text(p.parafrasiNeutra, p.testoLetterale, nome, p.dichiarante, COFOG_DIVISIONS[p.cofog], ...p.ribadita.map((r) => r.testoLetterale)),
      };
    }),
  ];
}
