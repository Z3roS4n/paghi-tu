"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = ":is(.chart-frame, .reveal-bars):not([data-inview])";

/**
 * Marca grafici e barre quando entrano nello schermo: l'animazione parte lì e si completa da sola,
 * così il grafico è leggibile per intero invece di disegnarsi a metà mentre si scorre.
 */
export function InViewMarker() {
  const path = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-inview", "");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.2 },
    );
    let queued = false;
    const scan = () => {
      queued = false;
      for (const el of document.querySelectorAll(SELECTOR)) io.observe(el);
    };
    scan();
    // Risultati dell'archivio, cambi di vista e simili aggiungono grafici dopo il primo render.
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [path]);

  return null;
}
