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
      className={`min-h-11 rounded-ctl border-[1.5px] px-3.5 text-[15px] font-bold whitespace-nowrap transition-[transform,border-color,background-color] active:translate-y-px ${
        active ? "border-accent bg-accent-soft text-accent" : "border-rule bg-paper-raised text-ink-soft hover:border-ink-faint hover:text-ink"
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
      <div className="flex min-h-12 items-center gap-3 rounded-ctl border-[1.5px] border-rule bg-paper-raised px-4 focus-within:border-accent focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent">
        <MagnifyingGlassIcon size={20} aria-hidden className="shrink-0 text-ink-faint" />
        <input
          id="archivio-q"
          type="search"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Cerca: pensioni, Draghi, Superbonus, 2019…"
          autoComplete="off"
          className="w-full min-w-0 bg-transparent py-3.5 text-lg outline-none placeholder:text-ink-faint focus-visible:outline-none"
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
          <ul className="grid gap-2" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="rounded-card bg-paper-raised px-4 py-4">
                <span className="block h-3 w-20 rounded-ctl bg-paper-sunk" />
                <span className="mt-2.5 block h-4 w-2/3 rounded-ctl bg-paper-sunk" />
                <span className="mt-2 block h-3 w-1/3 rounded-ctl bg-paper-sunk" />
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <p className="text-ink-soft">
            Nessun risultato{filters.q ? ` per «${filters.q}»` : ""}. Prova con meno parole o togli un filtro.
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink-faint">
              {results.length.toLocaleString("it-IT")} {results.length === 1 ? "risultato" : "risultati"}
            </p>
            <ul className="mt-3 grid gap-2">
              {results.slice(0, limit).map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className="group grid min-w-0 gap-1.5 rounded-card bg-paper-raised px-4 py-3.5 transition-colors hover:bg-paper-sunk md:grid-cols-[9rem_1fr] md:gap-6 md:px-5"
                  >
                    <span className="md:pt-0.5">
                      <span className="inline-flex min-h-6 items-center rounded-ctl bg-paper-sunk px-2 text-[13px] font-bold text-ink-soft group-hover:bg-paper">
                        {ARCHIVE_KINDS[e.tipo]}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold break-words group-hover:text-accent">{e.titolo}</span>
                      <span className="mt-0.5 block text-[15px] break-words text-ink-soft">{e.dettaglio}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {results.length > limit ? (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-ctl sm:inline-flex sm:w-auto border-[1.5px] border-rule bg-paper-raised px-5 font-bold transition-[transform,border-color] hover:border-ink-faint active:translate-y-px"
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
