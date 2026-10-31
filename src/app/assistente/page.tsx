import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentChat } from "@/components/agent/agent-chat";
import { PageHead, Wrap } from "@/components/ui";

export const metadata: Metadata = {
  title: "Assistente in anteprima",
  robots: { index: false, follow: false },
};

export default function AssistantPage() {
  if (process.env.AGENT_ENABLED !== "1" || process.env.VERCEL_ENV !== "preview") notFound();

  return (
    <Wrap className="pb-20">
      <PageHead kicker="Anteprima protetta" title="Chiedi ai dati di Paghi Tu">
        <p>Un assistente AI cerca nei dati pubblicati sul sito e mostra le fonti usate. Se non trova una risposta verificabile, si astiene.</p>
      </PageHead>
      <AgentChat />
      <p className="mt-6 max-w-3xl text-sm text-ink-soft">
        Le domande e un riferimento limitato alla conversazione sono conservati temporaneamente per permettere il seguito. Il contesto scade dopo 30 minuti; la cancellazione fisica dei dati scaduti può avvenire successivamente. Non inserire dati personali.
      </p>
    </Wrap>
  );
}
