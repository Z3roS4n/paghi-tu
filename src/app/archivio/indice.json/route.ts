import { archiveEntries } from "@/server/archive";

// Nessun dato di richiesta: la risposta viene prerenderizzata in build come file statico.
export function GET() {
  return Response.json(archiveEntries());
}
