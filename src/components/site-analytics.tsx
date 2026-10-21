"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// La ricerca dell'archivio mette nell'URL quello che si scrive: alle statistiche arriva solo il percorso.
const withoutQuery = (event: BeforeSendEvent) => ({ ...event, url: event.url.split(/[?#]/)[0] });

/** Vercel Web Analytics: senza cookie, dati aggregati (vedi /privacy). */
export function SiteAnalytics() {
  return <Analytics beforeSend={withoutQuery} />;
}
