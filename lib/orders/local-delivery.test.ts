import { describe, expect, it } from "vitest";
import { haversineKm, localFeeForDistance, MAX_LOCAL_FEE } from "./local-delivery";

describe("haversineKm", () => {
  it("distância nula entre o mesmo ponto", () => {
    expect(haversineKm({ lat: -23.1171, lng: -46.5502 }, { lat: -23.1171, lng: -46.5502 })).toBe(0);
  });

  it("Atibaia → São Paulo fica em torno de 50 km em linha reta", () => {
    const km = haversineKm(
      { lat: -23.1171, lng: -46.5502 },
      { lat: -23.5505, lng: -46.6333 },
    );
    expect(km).toBeGreaterThan(45);
    expect(km).toBeLessThan(55);
  });
});

describe("localFeeForDistance", () => {
  const tiers = [
    { upToKm: 20, fee: 40 },
    { upToKm: 10, fee: 0 },
  ];

  it("escolhe a primeira faixa que contém a distância, mesmo fora de ordem", () => {
    expect(localFeeForDistance(tiers, 8)).toBe(0);
    expect(localFeeForDistance(tiers, 15)).toBe(40);
  });

  it("além do último raio devolve null", () => {
    expect(localFeeForDistance(tiers, 21)).toBeNull();
  });

  it("distância desconhecida usa a faixa mais distante", () => {
    expect(localFeeForDistance(tiers, null)).toBe(40);
  });

  it("sem faixas não há taxa", () => {
    expect(localFeeForDistance([], 5)).toBeNull();
  });

  it("o teto das taxas é R$ 50,00", () => {
    expect(MAX_LOCAL_FEE).toBe(50);
  });
});
