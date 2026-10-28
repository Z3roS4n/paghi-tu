import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, GithubLogoIcon } from "@phosphor-icons/react/ssr";
import { AccountsTimeline, DebtByGovernment, EuropeBlock, MeasureGaps, MoneyStory, SemesterCard, WhatChanged } from "@/components/sections/finance";
import { BigNumber, ButtonLink, SourceNote, Tile, Wrap } from "@/components/ui";
import { REPO_URL } from "@/lib/contribute";
import { formatInt, formatMonth } from "@/lib/format";
import { headline } from "@/server/finance";
import { homeStats } from "@/server/stats";
import vasi from "../../public/img/vasi-piazza-montecitorio.jpg";

const euro = (n: number) => `${formatInt(n)} €`;

export default function Home() {
  const h = headline();
  const s = homeStats();

  const sections = [
    { href: "/spesa", title: "Spesa", body: "Spesa, entrate, disavanzo e debito per residente, anno per anno, con le fonti e i controlli." },
    { href: "/governi", title: "Governi", body: `I ${s.governmentCount} governi dal 1945: date, maggioranze, manovre e debito durante il mandato.` },
    { href: "/leggi-di-bilancio", title: "Leggi di bilancio", body: `${s.budgetLawCount} atti di bilancio con gli estremi su Normattiva e il governo che li ha presentati.` },
    { href: "/atti", title: "Leggi e decreti", body: "I decreti e le leggi che autorizzano una spesa o cambiano un'entrata, con gli importi della norma." },
    { href: "/promesse", title: "Promesse per il 2027", body: "Cosa promettono i partiti, con la frase esatta e la fonte. Stesse regole per tutti." },
    { href: "/misure", title: "Misure", body: "Costo stimato all'approvazione contro costo effettivo, per Quota 100, Superbonus, RdC e altre." },
    { href: "/archivio", title: "Archivio", body: "Cerca fra governi, manovre, misure e promesse in un solo posto." },
  ];

  return (
    <>
      <Wrap>
        <div className="grid pt-2 pb-6 lg:grid-cols-2 lg:items-center lg:gap-x-7 lg:pt-5 lg:pb-9">
          <figure className="hero-image m-0 overflow-hidden rounded-card bg-paper-sunk lg:order-2">
            <Image
              src={vasi}
              alt="Incisione del 1752: piazza di Monte Citorio con il palazzo al centro, carrozze e passanti sul selciato."
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="aspect-[4/3] w-full object-cover lg:aspect-[7/5] dark:brightness-[0.82] dark:contrast-[1.05]"
            />
          </figure>
          <div className="hero-card relative mx-2.5 -mt-12 rounded-card bg-paper-raised px-4.5 pt-5 pb-5.5 shadow-card lg:order-1 lg:m-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <h1 className="text-[clamp(1.9rem,7.6vw,3.4rem)] leading-[1.04] font-extrabold">Quanto spende lo Stato con i nostri soldi?</h1>
            <BigNumber value={formatInt(h.spesa)} unit="€" className="mt-3.5 text-[clamp(3.6rem,18vw,6.6rem)]" />
            <p className="mt-2.5 max-w-[30em] text-[17.5px] text-ink-soft">
              per ogni residente nel {h.anno}, fra Stato, regioni, comuni ed enti di previdenza. Sono {euro(h.spesa / 365)} al giorno,
              neonati compresi.
            </p>
            <div className="mt-4.5 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              <ButtonLink href="#t-cento">Dove vanno</ButtonLink>
              <ButtonLink href="/metodo" tone="outline">
                Il metodo
              </ButtonLink>
            </div>
          </div>
          <p className="mt-2 text-[13.5px] leading-snug text-ink-faint lg:order-3 lg:col-start-2 lg:-mt-4">
            Piazza di Monte Citorio, incisa da Giuseppe Vasi nel 1752. Oggi nel palazzo c&apos;è la Camera. Pubblico dominio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
          <Tile label={`Entrate ${h.anno}`} value={euro(h.entrate)} note="a testa, fra tasse e contributi" />
          <Tile label={`Disavanzo ${h.anno}`} value={euro(-h.saldo)} note="quello che le entrate non coprono" />
          <Tile className="col-span-2 md:col-span-1" label={`Interessi sul debito ${h.anno}`} value={euro(h.interessi)} note="per residente" />
          <Tile
            dark
            className="col-span-2 md:col-span-3 lg:col-span-1"
            label={`Debito pubblico, ${formatMonth(h.debito.mese)}`}
            value={`${euro(h.debito.perResidente)} a testa`}
            note={`${formatInt(h.debito.totale / 1000)} miliardi in tutto${h.debito.provvisorio ? ", dato provvisorio" : ""}`}
          />
        </div>
        <SourceNote>Eurostat per i conti {h.anno}, Banca d&apos;Italia per il debito.</SourceNote>

        <SemesterCard />
        <MoneyStory />
        <AccountsTimeline />
        <WhatChanged />
        <EuropeBlock />
        <DebtByGovernment />
        <MeasureGaps more />

        <section aria-labelledby="t-sezioni" className="mt-16 md:mt-24">
          <h2 id="t-sezioni" className="reveal text-[clamp(1.8rem,7vw,2.8rem)] leading-[1.05] font-extrabold">
            Cosa trovi qui
          </h2>
          <ul className="mt-6 grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((sec) => (
              <li key={sec.href} className="reveal">
                <Link href={sec.href} className="group flex h-full flex-col gap-1.5 rounded-card bg-paper-raised px-4.5 py-4.5 transition-colors hover:bg-paper-sunk">
                  <span className="flex items-center justify-between gap-4 text-xl font-bold">
                    {sec.title}
                    <ArrowRightIcon size={18} weight="bold" aria-hidden className="text-accent transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="text-[15.5px] text-ink-soft">{sec.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="t-err" className="reveal mt-16 rounded-card bg-night px-4.5 py-6 text-night-ink md:mt-24 md:grid md:grid-cols-2 md:items-center md:gap-8 md:px-10 md:py-9">
          <h2 id="t-err" className="text-[clamp(1.8rem,7vw,2.8rem)] leading-[1.05] font-extrabold">
            Hai trovato un errore?
          </h2>
          <div>
            <p className="mt-2.5 text-night-ink/75 md:mt-0">
              I dati li raccoglie un&apos;intelligenza artificiale e li ricontrolla un secondo agente, sulla fonte. Se un numero non ti torna,
              segnalalo: ogni correzione resta nel registro pubblico, con il valore di prima e il motivo.
            </p>
            <div className="mt-4.5 grid gap-2.5 sm:flex sm:flex-wrap">
              <ButtonLink href="/correzioni" tone="light">
                Come segnalarlo
              </ButtonLink>
              <ButtonLink href={REPO_URL} tone="ghost" external>
                <GithubLogoIcon size={18} aria-hidden />
                GitHub
              </ButtonLink>
            </div>
          </div>
        </section>
      </Wrap>
    </>
  );
}
