// Manda una segnalazione della routine via email con Resend (D-018).
// Uso: node scripts/notify.ts "<oggetto>" <file con il testo | ->
// Destinatario e mittente stanno nei segreti della routine, mai nel repo: il repo è pubblico.
import { readFileSync } from "node:fs";

const NAMES = ["RESEND_API_KEY", "PAGHITU_NOTIFY_TO", "PAGHITU_NOTIFY_FROM"] as const;
const missing = NAMES.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Segnalazione non inviata: mancano ${missing.join(", ")}`);
  process.exit(2);
}
const [apiKey, to, from] = NAMES.map((k) => process.env[k] as string);

const [subject, bodyPath] = process.argv.slice(2);
if (!subject || !bodyPath) {
  console.error('Uso: node scripts/notify.ts "<oggetto>" <file | ->');
  process.exit(2);
}
const text = readFileSync(bodyPath === "-" ? 0 : bodyPath, "utf8");

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
  body: JSON.stringify({
    from,
    to: to.split(",").map((s) => s.trim()),
    subject: `[Paghi Tu] ${subject}`,
    text,
  }),
  signal: AbortSignal.timeout(30_000),
});
if (!res.ok) {
  console.error(`Resend ${res.status}: ${await res.text()}`);
  process.exit(1);
}
console.log(`Segnalazione inviata (${((await res.json()) as { id: string }).id})`);
