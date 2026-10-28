"use client";

import { useSyncExternalStore } from "react";
import { Tag } from "@/components/ui";

const noop = () => () => {};
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });

// La pagina è statica e la data di oggi la conosce solo il browser: prima di idratare (o senza
// JavaScript) si mostra la data di entrata in vigore, che è vera prima e dopo.
export function ActStatus({ status, inForceFrom, inForceLabel }: { status: string; inForceFrom: string; inForceLabel: string }) {
  const now = useSyncExternalStore(noop, today, () => null);
  if (now === null) return <Tag tone="plain">Entrata in vigore: {inForceLabel}</Tag>;
  if (now < inForceFrom) return <Tag>Pubblicato, in vigore dal {inForceLabel}</Tag>;
  return <Tag tone="plain">{status}</Tag>;
}
