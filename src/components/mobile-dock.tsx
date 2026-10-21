"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { BankIcon, CaretRightIcon, DotsThreeIcon, QuotesIcon, ReceiptIcon, ScalesIcon } from "@phosphor-icons/react";
import { DOCK_NAV, MORE_NAV, isCurrent } from "@/lib/navigation";

const ICONS = { receipt: ReceiptIcon, bank: BankIcon, quotes: QuotesIcon, scales: ScalesIcon };

const item =
  "flex min-h-[var(--dock-h)] w-full flex-col items-center justify-center gap-0.5 text-xs font-bold text-ink-soft [-webkit-tap-highlight-color:transparent] aria-[current=page]:text-ink";
const pill =
  "grid h-[30px] w-12 place-items-center rounded-ctl transition-[background-color,transform] group-active:scale-90 group-aria-[current=page]:bg-accent-soft group-aria-[current=page]:text-accent";

export function MobileDock() {
  const path = usePathname();
  const sheet = useRef<HTMLDialogElement>(null);
  const moreActive = MORE_NAV.some((m) => isCurrent(path, m.href));

  return (
    <>
      <nav
        aria-label="Navigazione principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper-raised/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-[520px] grid-cols-5">
          {DOCK_NAV.map((d) => {
            const Icon = ICONS[d.icon];
            return (
              <li key={d.href}>
                <Link href={d.href} aria-current={isCurrent(path, d.href) ? "page" : undefined} className={`group ${item}`}>
                  <span className={pill}>
                    <Icon size={22} aria-hidden />
                  </span>
                  {d.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-current={moreActive ? "page" : undefined}
              onClick={() => sheet.current?.showModal()}
              className={`group ${item}`}
            >
              <span className={pill}>
                <DotsThreeIcon size={22} weight="bold" aria-hidden />
              </span>
              Altro
            </button>
          </li>
        </ul>
      </nav>
      <dialog
        ref={sheet}
        aria-labelledby="altro-titolo"
        onClick={(e) => {
          if (e.target === e.currentTarget) sheet.current?.close();
        }}
        className="sheet mx-auto mt-auto mb-0 w-full max-w-[560px] rounded-t-card bg-paper-raised p-0 text-ink backdrop:bg-night/45"
      >
        <div className="px-4 pt-2.5 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div aria-hidden className="mx-auto mb-2.5 h-1 w-11 rounded-full bg-rule" />
          <h2 id="altro-titolo" className="mx-1 mb-1 text-[22px] font-bold">
            Altro
          </h2>
          <ul>
            {MORE_NAV.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  onClick={() => sheet.current?.close()}
                  className="flex min-h-14 items-center justify-between border-b border-rule px-1 font-semibold"
                >
                  <span>
                    {m.label}
                    <small className="block text-sm font-normal text-ink-faint">{m.hint}</small>
                  </span>
                  <CaretRightIcon size={18} className="text-accent" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => sheet.current?.close()}
            className="mt-3 min-h-12 w-full rounded-ctl border-[1.5px] border-rule font-bold"
          >
            Chiudi
          </button>
        </div>
      </dialog>
    </>
  );
}
