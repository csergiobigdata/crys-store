import { describe, expect, it } from "vitest";
import { getShippingOptions, resolveZone, ufFromCep } from "./shipping";

// 2026-03-10 é terça; 10h em Brasília = 13h UTC.
const tuesdayMorning = new Date("2026-03-10T13:00:00Z");
const tuesdayEvening = new Date("2026-03-10T22:00:00Z");
const sunday = new Date("2026-03-15T13:00:00Z");

describe("ufFromCep", () => {
  it("mapeia faixas de CEP para UF", () => {
    expect(ufFromCep("06010-170")).toBe("SP");
    expect(ufFromCep("20040-020")).toBe("RJ");
    expect(ufFromCep("69010-000")).toBe("AM");
    expect(ufFromCep("70040-010")).toBe("DF");
    expect(ufFromCep("90010-000")).toBe("RS");
  });

  it("rejeita CEP inválido", () => {
    expect(ufFromCep("123")).toBeNull();
  });
});

describe("resolveZone", () => {
  it("reconhece Atibaia pelo CEP, mesmo sem a cidade", () => {
    expect(resolveZone("12940-000")?.zone).toBe("same_city");
  });

  it("reconhece Atibaia pelo nome, com acento e caixa diferentes", () => {
    expect(resolveZone("12900-000", "ATIBAIA")?.zone).toBe("same_city");
  });

  it("reconhece a região de Atibaia", () => {
    expect(resolveZone("12900-000", "Bragança Paulista")?.zone).toBe("region");
  });

  it("não confunde Atibaia de outro estado", () => {
    expect(resolveZone("20040-020", "Atibaia")?.zone).toBe("sudeste");
  });

  it("classifica o resto de SP e os demais estados", () => {
    expect(resolveZone("06010-170", "Osasco")?.zone).toBe("sp");
    expect(resolveZone("40010-000")?.zone).toBe("nordeste");
    expect(resolveZone("69010-000")?.zone).toBe("norte");
  });
});

describe("getShippingOptions", () => {
  it("Atibaia: Correios + entrega local no mesmo dia e no dia seguinte", () => {
    const quote = getShippingOptions({
      cep: "12940-000",
      city: "Atibaia",
      totalUnits: 1,
      now: tuesdayMorning,
    });
    expect(quote?.options.map((o) => o.id)).toEqual([
      "pac",
      "sedex",
      "mini",
      "same_day",
      "next_day",
      "local_arranged",
    ]);
  });

  it("depois das 14h ou no domingo não oferece entrega no mesmo dia", () => {
    for (const now of [tuesdayEvening, sunday]) {
      const ids = getShippingOptions({ cep: "12940-000", totalUnits: 1, now })?.options.map(
        (o) => o.id,
      );
      expect(ids).not.toContain("same_day");
      expect(ids).toContain("next_day");
    }
  });

  it("fora de Atibaia não há Mini Envios nem entrega local", () => {
    const quote = getShippingOptions({
      cep: "06010-170",
      city: "Osasco",
      totalUnits: 1,
      now: tuesdayMorning,
    });
    expect(quote?.options.map((o) => o.id)).toEqual(["pac", "sedex"]);
  });

  it("cidade da região de Atibaia também não tem Mini Envios", () => {
    const ids = getShippingOptions({
      cep: "12900-000",
      city: "Bragança Paulista",
      totalUnits: 1,
      now: tuesdayMorning,
    })?.options.map((o) => o.id);
    expect(ids).not.toContain("mini");
    expect(ids).toContain("same_day");
  });

  it("em Atibaia, Mini Envios só para pedidos pequenos", () => {
    const ids = getShippingOptions({
      cep: "12940-000",
      totalUnits: 4,
      now: tuesdayMorning,
    })?.options.map((o) => o.id);
    expect(ids).not.toContain("mini");
  });

  it("frete cresce com a distância", () => {
    const price = (cep: string) =>
      getShippingOptions({ cep, totalUnits: 1 })?.options.find((o) => o.id === "pac")?.price ?? 0;
    expect(price("12940-000")).toBeLessThan(price("06010-170"));
    expect(price("06010-170")).toBeLessThan(price("20040-020"));
    expect(price("20040-020")).toBeLessThan(price("69010-000"));
  });

  it("devolve null para CEP inexistente", () => {
    expect(getShippingOptions({ cep: "00000-000", totalUnits: 1 })).toBeNull();
  });
});

describe("entrega local a combinar", () => {
  it("aparece em Atibaia, com valor zero e prazo a combinar", () => {
    const option = getShippingOptions({
      cep: "12940-000",
      city: "Atibaia",
      totalUnits: 1,
      now: tuesdayMorning,
    })?.options.find((o) => o.id === "local_arranged");
    expect(option?.price).toBe(0);
    expect(option?.deadline).toBe("a combinar");
    expect(option?.label).toContain("a combinar com a loja");
  });

  it("não aparece fora de Atibaia quando não há produto de teste", () => {
    for (const [cep, city] of [
      ["06010-170", "Osasco"],
      ["12900-000", "Bragança Paulista"],
    ]) {
      const ids = getShippingOptions({ cep, city, totalUnits: 1, now: tuesdayMorning })?.options.map(
        (o) => o.id,
      );
      expect(ids).not.toContain("local_arranged");
    }
  });

  it("com produto de teste aparece para qualquer destino", () => {
    for (const [cep, city] of [
      ["06010-170", "Osasco"],
      ["20040-020", "Rio de Janeiro"],
      ["69010-000", "Manaus"],
    ]) {
      const ids = getShippingOptions({
        cep,
        city,
        totalUnits: 1,
        hasTestProduct: true,
        now: tuesdayMorning,
      })?.options.map((o) => o.id);
      expect(ids).toContain("local_arranged");
    }
  });
});
