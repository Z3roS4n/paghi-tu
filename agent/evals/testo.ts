// Confronti deterministici fra i valori attesi del golden set e il testo delle fonti: stessa
// normalizzazione per entrambi i lati, nessuna somiglianza approssimata. Un valore è trovato
// solo se una delle sue forme scritte compare tale e quale nel testo normalizzato.

const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

// Un URL di fonte è ben formato se è http(s), si legge come URL e non contiene spazi: z.url()
// accetta anche «https://host/path (etichetta)», perché il parser codifica lo spazio.
export function isWellFormedUrl(raw: string): boolean {
  if (/\s/.test(raw)) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// Spazi, virgolette, apostrofi, trattini e a capo scritti in modi diversi diventano una sola forma.
export function normalizeText(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/­/g, "")
    .replace(/(\p{L})-\s*\n\s*(\p{Ll})/gu, "$1$2")
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/[“”„‟«»″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .replace(/ ([,.;:!?)\]])/g, "$1")
    .replace(/([(\[]) /g, "$1")
    .toLowerCase()
    .trim();
}

// Una citazione con tagli («[…]») è giusta se ogni pezzo fra un taglio e l'altro sta nella fonte.
export function verbatimFragments(quote: string): string[] {
  return normalizeText(quote)
    .split(/\[\.\.\.\]|\(\.\.\.\)|\.\.\./)
    .map((f) => f.trim().replace(/^[,;:.\s"]+|[,;:\s"]+$/g, ""))
    .filter((f) => f.length >= 3);
}

export function missingFragments(quote: string, normalizedSource: string): string[] {
  return verbatimFragments(quote).filter((f) => !normalizedSource.includes(f));
}

const it = (v: number, digits: number, grouping = true) =>
  v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: digits, useGrouping: grouping });

// Milioni e miliardi valgono solo se il valore è esatto a quella scala: 18.550.000.000 si legge
// «18.550» milioni, ma 4.529.138.051 non diventa «4,5 miliardi», che potrebbe essere un'altra cifra.
const exactAt = (abs: number, scaled: number, scale: number) => scaled !== 0 && Math.abs(scaled * scale - abs) < 0.5;

// Le forme in cui una fonte italiana o un CSV Eurostat può scrivere un numero.
// Per gli importi in euro valgono anche milioni e miliardi arrotondati, come nelle tabelle UPB e RGS.
export function numberForms(value: number, unit?: string): string[] {
  const abs = Math.abs(value);
  const base = (v: number) => [String(v), it(v, 3), it(v, 3, false), it(v, 3).replace(/\./g, " ")];
  const forms = [...base(value), ...base(abs)];
  if (unit === "euro") {
    // Nudi si cercano solo i milioni, l'unità delle tabelle UPB e RGS; i miliardi solo con la parola.
    for (const scale of [1e6]) {
      for (const digits of [0, 1, 2, 3]) {
        const scaled = Number((abs / scale).toFixed(digits));
        if (!exactAt(abs, scaled, scale)) continue;
        forms.push(it(scaled, digits), it(scaled, digits, false));
      }
    }
  }
  // Una forma con meno di tre cifre («6» per 6,1 miliardi) troverebbe qualsiasi cosa.
  const minDigits = Math.min(3, String(abs).replace(/\D/g, "").length);
  const plain = [...new Set(forms)].filter((f) => f.replace(/\D/g, "").length >= minDigits);
  // Con l'unità scritta accanto («35 miliardi», «6,1 mld») anche una forma corta è un riscontro.
  const worded: string[] = [];
  if (unit === "euro") {
    for (const [scale, words] of [[1e9, ["miliardi", "mld"]], [1e6, ["milioni", "mln"]]] as const) {
      for (const digits of [0, 1, 2, 3]) {
        const scaled = Number((abs / scale).toFixed(digits));
        if (!exactAt(abs, scaled, scale)) continue;
        for (const w of words) worded.push(`${it(scaled, digits)} ${w}`);
      }
    }
  }
  return [...new Set([...plain, ...worded])];
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// La forma deve stare da sola: «18.550» non vale dentro «118.550» né dentro «18.550,7».
// Prima può esserci una virgola, che nei CSV separa le colonne.
// Sono ammessi zeri decimali in coda («-71303.0» nel CSV Eurostat vale -71303).
export function findNumber(text: string, value: number, unit?: string): string | null {
  for (const form of numberForms(value, unit)) {
    const re = new RegExp(`(?<!\\d)(?<!\\d\\.)${escape(form)}(?:[.,]0+)?(?![\\d]|[.,]\\d)`);
    if (re.test(text)) return form;
  }
  // Un importo in euro scritto con i centesimi («131.558.610.980,03») vale l'euro arrotondato del record.
  if (unit === "euro" && Number.isInteger(value)) {
    for (const m of text.matchAll(/(?<![\d.,])(\d{1,3}(?:\.\d{3})+),(\d{2})(?![\d])/g)) {
      if (Math.round(Number(`${m[1].replace(/\./g, "")}.${m[2]}`)) === Math.abs(value)) return m[0];
    }
  }
  return null;
}

// Le date ISO si cercano anche nelle forme estese e numeriche usate da Camera, governo e giornali.
export function dateForms(iso: string): string[] {
  const [y, m, d] = iso.split("-").map(Number);
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return [
    iso,
    `${y}${mm}${dd}`,
    `${dd}/${mm}/${y}`,
    `${d}/${m}/${y}`,
    `${dd}.${mm}.${y}`,
    `${dd}-${mm}-${y}`,
    `${d} ${MONTHS[m - 1]} ${y}`,
    `${dd} ${MONTHS[m - 1]} ${y}`,
    ...(d === 1 ? [`1° ${MONTHS[m - 1]} ${y}`, `1º ${MONTHS[m - 1]} ${y}`] : []),
  ].map(normalizeText);
}

// Il dichiarante può essere una lista («Guerra, Torto (firmatari)»): ogni nome, senza le note fra
// parentesi, deve stare nella fonte per intero. Solo un nome di persona di due parole («Elly Schlein»)
// vale anche con il cognome; «Alleanza Verdi e Sinistra» non vale con «Sinistra».
export function findDeclarant(normalizedSource: string, value: string): string | null {
  const names = value.replace(/\([^)]*\)/g, "").split(/[;,]/).map((n) => normalizeText(n)).filter(Boolean);
  const surname = (n: string) => {
    const words = n.split(" ");
    return words.length === 2 && words[1].length >= 4 && normalizedSource.includes(words[1]) ? words[1] : null;
  };
  const found = names.map((n) => (normalizedSource.includes(n) ? n : surname(n)));
  return names.length && found.every(Boolean) ? found.join("; ") : null;
}

// Il costo dichiarato è un testo di Paghi Tu: si cercano le parole fra apici, se ci sono, altrimenti
// la cifra («8 mld», «almeno 5 miliardi»).
export function findDeclaredCost(normalizedSource: string, value: string): string | null {
  const quoted = [...value.matchAll(/'([^']{6,})'/g)].map((m) => m[1]);
  if (quoted.length) return quoted.every((q) => normalizedSource.includes(normalizeText(q))) ? quoted.join("; ") : null;
  const m = value.match(/(\d+(?:[.,]\d+)?)\s*(mld|miliardi|milioni|mln)/i);
  if (!m) return null;
  const amount = Number(m[1].replace(",", ".")) * (/^m(ld|iliardi)/i.test(m[2]) ? 1e9 : 1e6);
  return findNumber(normalizedSource, amount, "euro");
}

export function findValue(normalizedSource: string, value: string | number, unit?: string): string | null {
  if (typeof value === "number") return findNumber(normalizedSource, value, unit);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return dateForms(value).find((f) => normalizedSource.includes(f)) ?? null;
  // Un testo con tagli si cerca a pezzi, come le citazioni.
  return verbatimFragments(value).length && missingFragments(value, normalizedSource).length === 0 ? normalizeText(value) : null;
}

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", hellip: "…",
  ndash: "–", mdash: "—", shy: "", deg: "°", ordm: "º", euro: "€",
  agrave: "à", egrave: "è", eacute: "é", igrave: "ì", ograve: "ò", ugrave: "ù",
  Agrave: "À", Egrave: "È", Eacute: "É", Igrave: "Ì", Ograve: "Ò", Ugrave: "Ù",
};

const decodeEntities = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name] ?? m);

const stripTags = (html: string) =>
  decodeEntities(
    html
      .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  );

// Testo leggibile da una pagina HTML o XML: via script, stili e tag, entità decodificate.
// Le pagine Inertia o simili (Partito Capibara) mettono il contenuto in un attributo data-* come
// JSON: si decodifica e si aggiunge in coda, perché è il testo che il sito mostra.
export function htmlToText(html: string): string {
  const inline = [...html.matchAll(/\sdata-[\w-]+="([^"]{200,})"/g)].map((m) =>
    stripTags(
      decodeEntities(m[1])
        .replace(/\\u([0-9a-f]{4})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\n/g, " ")
        .replace(/\\(["/])/g, "$1"),
    ),
  );
  // Le date di pubblicazione stanno spesso solo in <meta content> o <time datetime>.
  const dates = [...html.matchAll(/<(?:meta|time)\b[^>]*?(?:content|datetime)="([^"]{4,200})"/gi)].map((m) => decodeEntities(m[1]));
  return [stripTags(html), ...inline, ...dates].join("\n");
}
