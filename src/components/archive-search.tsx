"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { ARCHIVE_KINDS, type ArchiveEntry, type ArchiveKind, searchArchive } from "@/lib/domain/archive";

const PAGE = 40;
const collator = new Intl.Collator("it-IT", { sensitivity: "base", ignorePunctuation: true });
type Filters = { q: string; tipo: ArchiveKind | null; partito: string | null };

function readUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  const tipo = p.get("tipo");
  return { q: p.get("q") ?? "", tipo: tipo && tipo in ARCHIVE_KINDS ? (tipo as ArchiveKind) : null, partito: p.get("partito") };
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.tipo) p.set("tipo", f.tipo);
  if (f.partito) p.set("partito", f.partito);
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`border px-3 py-1.5 text-sm transition-transform active:scale-[0.98] ${
        active ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function ArchiveSearch() {
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filters, setFilters] = useState<Filters>({ q: "", tipo: null, partito: null });
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    let live = true;
    fetch("/archivio/indice.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: ArchiveEntry[]) => {
        if (!live) return;
        setFilters(readUrl());
        setEntries(data);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  function update(next: Partial<Filters>) {
    const f = { ...filters, ...next };
    if (next.tipo !== undefined && next.tipo !== "promessa") f.partito = null;
    setFilters(f);
    setLimit(PAGE);
    writeUrl(f);
  }

  const results = entries ? searchArchive(entries, filters.q, filters) : [];
  const parties = entries
    ? [...new Map(entries.flatMap((e) => (e.partito ? [[e.partito.id, e.partito.nome] as const] : []))).entries()].toSorted((a, b) =>
        collator.compare(a[1], b[1]),
      )
    : [];

  return (
    <div>
      <label htmlFor="archivio-q" className="sr-only">
        Cerca nell&apos;archivio
      </label>
      <div className="flex items-center gap-3 border border-ink bg-paper-raised px-4 focus-within:outline-2 focus-within:outline-accent">
        <MagnifyingGlassIcon size={20} aria-hidden className="shrink-0 text-ink-faint" />
        <input
          id="archivio-q"
          type="search"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Cerca: pensioni, Draghi, Superbonus, 2019…"
          autoComplete="off"
          className="w-full bg-transparent py-4 text-lg outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Tipo di contenuto">
        <Chip active={filters.tipo === null} onClick={() => update({ tipo: null })}>
          Tutto
        </Chip>
        {(Object.entries(ARCHIVE_KINDS) as [ArchiveKind, string][]).map(([k, label]) => (
          <Chip key={k} active={filters.tipo === k} onClick={() => update({ tipo: k })}>
            {label}
          </Chip>
        ))}
      </div>

      {filters.tipo === "promessa" ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Partito">
          <Chip active={filters.partito === null} onClick={() => update({ partito: null })}>
            Tutti i partiti
          </Chip>
          {parties.map(([id, nome]) => (
            <Chip key={id} active={filters.partito === id} onClick={() => update({ partito: id })}>
              {nome}
            </Chip>
          ))}
        </div>
      ) : null}

      <div className="mt-8" aria-live="polite" aria-busy={entries === null && !failed}>
        {failed ? (
          <p className="text-ink-soft">L&apos;archivio non si è caricato. Ricarica la pagina per riprovare.</p>
        ) : entries === null ? (
          <ul className="divide-y divide-rule border-y border-rule" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="py-4">
                <span className="block h-4 w-2/3 bg-rule" />
                <span className="mt-2 block h-3 w-1/3 bg-rule/60" />
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <p className="text-ink-soft">
            Nessun risultato{filters.q ? ` per «${filters.q}»` : ""}. Prova con meno parole o togli un filtro.
          </p>
        ) : (
          <>
            <p className="font-mono text-xs text-ink-faint">
              {results.length.toLocaleString("it-IT")} {results.length === 1 ? "risultato" : "risultati"}
            </p>
            <ul className="mt-3 divide-y divide-rule border-y border-rule">
              {results.slice(0, limit).map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="group grid gap-1 py-4 md:grid-cols-[9rem_1fr] md:gap-6">
                    <span className="font-mono text-xs text-ink-faint md:pt-1">{ARCHIVE_KINDS[e.tipo]}</span>
                    <span>
                      <span className="block group-hover:text-accent">{e.titolo}</span>
                      <span className="mt-1 block text-sm text-ink-soft">{e.dettaglio}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {results.length > limit ? (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="mt-6 border border-ink px-5 py-3 font-medium transition-transform active:scale-[0.98]"
              >
                Mostra altri {Math.min(PAGE, results.length - limit)}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
