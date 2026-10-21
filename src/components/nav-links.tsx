"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, isCurrent } from "@/lib/navigation";

export function NavLinks() {
  const path = usePathname();
  return (
    <ul className="flex gap-0.5">
      {MAIN_NAV.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={isCurrent(path, item.href) ? "page" : undefined}
            className="inline-flex min-h-10 items-center rounded-ctl px-3 text-[15px] font-semibold transition-colors hover:bg-paper-sunk aria-[current=page]:bg-ink aria-[current=page]:text-paper"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
