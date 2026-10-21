import { describe, expect, it } from "vitest";
import { formatCsv, parseCsv, parseCsvRecords } from "./csv.ts";

describe("parseCsv", () => {
  it("gestisce virgolette, virgole e a capo nei campi", () => {
    const rows = parseCsv('a,b\r\n"x, ""y""","riga\nnuova"\n');
    expect(rows).toEqual([
      ["a", "b"],
      ['x, "y"', "riga\nnuova"],
    ]);
  });

  it("ignora il BOM", () => {
    expect(parseCsvRecords("﻿anno,valore\n1946,1")).toEqual([{ anno: "1946", valore: "1" }]);
  });

  it("accetta un separatore diverso dalla virgola", () => {
    expect(parseCsvRecords('"DATA_OSS";"v"\n"2026/08/31";"3200847,7"', ";")).toEqual([
      { DATA_OSS: "2026/08/31", v: "3200847,7" },
    ]);
  });

  it("segnala righe con numero di campi errato", () => {
    expect(() => parseCsvRecords("a,b\n1")).toThrow(/riga 2/);
  });

  it("riscrive un CSV nello stesso formato in cui lo legge", () => {
    const text = '"a","b"\n"x, ""y""","riga\nnuova"\n';
    expect(formatCsv(parseCsv(text))).toBe(text);
  });
});
