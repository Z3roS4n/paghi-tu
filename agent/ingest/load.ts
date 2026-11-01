import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ExportInput } from "./export.ts";

const json = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, "utf8"));

export async function loadSiteData(root = "."): Promise<ExportInput> {
  const dir = join(root, "data");
  const seriesFiles = (await readdir(join(dir, "serie"))).filter((f) => f.endsWith(".json")).sort();
  const serie: Record<string, unknown> = {};
  for (const f of seriesFiles) serie[f.replace(/\.json$/, "")] = await json(join(dir, "serie", f));
  return {
    governi: await json(join(dir, "governi.json")),
    legislature: await json(join(dir, "legislature.json")),
    leggiBilancio: await json(join(dir, "leggi-bilancio.json")),
    misure: await json(join(dir, "misure.json")),
    partiti: await json(join(dir, "partiti.json")),
    promesse: await json(join(dir, "promesse.json")),
    correzioni: await json(join(dir, "correzioni.json")),
    finanzaPubblica: await json(join(dir, "finanza-pubblica.json")),
    serie,
  };
}
