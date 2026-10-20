import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Correzioni",
  description: "Registro pubblico delle correzioni ai dati pubblicati su Paghi Tu.",
};

export default function CorrectionsPage() {
  return (
    <ProsePage
      title="Correzioni"
      intro="Qui compare ogni modifica a un dato già pubblicato: valore precedente, valore nuovo, data e motivo."
    >
      <div className="border border-dashed border-rule p-8">
        <p className="!text-ink">Nessuna correzione a dati pubblicati, finora.</p>
        <p className="mt-2">
          Le correzioni fatte durante la verifica, prima della pubblicazione, sono descritte nel{" "}
          <Link href="/metodo" className="underline">metodo</Link>.
        </p>
      </div>
    </ProsePage>
  );
}
