import { describe, expect, it } from "vitest";
import { z } from "zod";
import partiesJson from "../../../data/partiti.json";
import promisesJson from "../../../data/promesse.json";
import statusJson from "../../../data/promesse-stato.json";
import { CampaignPromise, Party, PromiseCatalogStatus } from "./schemas.ts";

const parties = z.array(Party).parse(partiesJson);
const promises = z.array(CampaignPromise).parse(promisesJson);
const status = PromiseCatalogStatus.parse(statusJson);

describe("integrità delle promesse", () => {
  it("gli id sono unici e il prefisso coincide con il partito", () => {
    expect(new Set(promises.map((p) => p.id)).size).toBe(promises.length);
    expect(promises.filter((p) => p.id.split("-")[1] !== p.partitoId).map((p) => p.id)).toEqual([]);
  });

  it("ogni promessa appartiene a un partito censito", () => {
    const ids = new Set(parties.map((p) => p.id));
    expect(promises.filter((p) => !ids.has(p.partitoId)).map((p) => p.id)).toEqual([]);
  });

  it("le date cadono nel periodo della campagna", () => {
    const { dal, al } = status.periodo;
    expect(promises.filter((p) => p.data < dal || p.data > al).map((p) => p.id)).toEqual([]);
  });

  it("si pubblica solo ciò che ha passato la verifica indipendente", () => {
    expect(promises.filter((p) => !p.verifica.dettaglio.includes("✓")).map((p) => p.id)).toEqual([]);
    expect(promises.filter((p) => p.verifica.livello === "NV").map((p) => p.id)).toEqual([]);
    expect(status.pubblicate).toBe(promises.length);
  });
});
