/**
 * Entrega local (mesma cidade da loja): taxa por faixa de distância (raio em
 * linha reta a partir da loja) e taxa fixa do serviço de motoboy, ambas
 * definidas pelo administrador em /admin/configuracoes. Cálculo puro, sem
 * banco e sem rede, para ser usado também nos testes.
 */

/** Teto de qualquer taxa de entrega local, em reais. */
export const MAX_LOCAL_FEE = 50;

/** Quantidade máxima de faixas de distância configuráveis. */
export const MAX_LOCAL_TIERS = 5;

export type LocalDeliveryTier = {
  /** A faixa vale para destinos a até este raio (km) da loja. */
  upToKm: number;
  /** Taxa da faixa, de 0,00 (grátis) até MAX_LOCAL_FEE. */
  fee: number;
};

export type LocalDeliveryConfig = {
  originCep: string;
  originLat: number;
  originLng: number;
  tiers: LocalDeliveryTier[];
  /** Valor padrão do serviço de motoboy contratado pela loja. */
  motoboyFee: number;
};

/** O que o cálculo de frete precisa saber sobre a entrega local de um pedido. */
export type LocalDeliveryInputs = {
  tiers: LocalDeliveryTier[];
  motoboyFee: number;
  /** Distância loja → destino em km; null se não foi possível calcular. */
  distanceKm: number | null;
};

// Ponto de partida: centro de Atibaia-SP. O admin ajusta em /admin/configuracoes.
export const DEFAULT_LOCAL_DELIVERY: LocalDeliveryConfig = {
  originCep: "12940-000",
  originLat: -23.1171,
  originLng: -46.5502,
  tiers: [
    { upToKm: 10, fee: 0 },
    { upToKm: 20, fee: 30 },
  ],
  motoboyFee: 25,
};

export const DEFAULT_LOCAL_INPUTS: LocalDeliveryInputs = {
  tiers: DEFAULT_LOCAL_DELIVERY.tiers,
  motoboyFee: DEFAULT_LOCAL_DELIVERY.motoboyFee,
  distanceKm: null,
};

/** Distância em linha reta (km) entre dois pontos (fórmula de Haversine). */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

/**
 * Taxa da faixa que contém a distância. Retorna `null` quando o destino está
 * além do último raio. Com a distância desconhecida (`null`), usa a taxa da
 * faixa mais distante — nunca promete grátis sem saber a distância.
 */
export function localFeeForDistance(
  tiers: LocalDeliveryTier[],
  distanceKm: number | null,
): number | null {
  const sorted = [...tiers].sort((a, b) => a.upToKm - b.upToKm);
  if (sorted.length === 0) return null;
  if (distanceKm === null) return sorted[sorted.length - 1].fee;
  return sorted.find((tier) => distanceKm <= tier.upToKm)?.fee ?? null;
}
