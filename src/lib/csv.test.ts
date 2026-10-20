import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvRecords } from "./csv.ts";

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

  it("segnala righe con numero di campi errato", () => {
    expect(() => parseCsvRecords("a,b\n1")).toThrow(/riga 2/);
  });
});
