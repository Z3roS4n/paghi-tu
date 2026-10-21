export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

// Scrive come i CSV di ricerca: ogni campo fra virgolette, a capo LF, a capo finale.
export function formatCsv(rows: string[][]): string {
  return rows.map((r) => r.map((f) => `"${f.replaceAll('"', '""')}"`).join(",")).join("\n") + "\n";
}

export function parseCsvRecords(text: string, delimiter = ","): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text, delimiter);
  if (!header) return [];
  return rows.map((r, line) => {
    if (r.length !== header.length) {
      throw new Error(`CSV riga ${line + 2}: ${r.length} campi, attesi ${header.length}`);
    }
    return Object.fromEntries(header.map((h, i) => [h.trim(), r[i]]));
  });
}
