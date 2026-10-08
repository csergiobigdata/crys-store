/**
 * Frete da Chrys Store, com origem em Atibaia-SP.
 *
 * O valor depende da ZONA do destino (cidade/estado de entrega em relação a
 * Atibaia) e do serviço escolhido. Tudo aqui é cálculo puro (sem banco e sem
 * rede), então o valor mostrado no checkout e o cobrado no pedido saem da
 * mesma função, sempre rodada no servidor.
 *
 * IMPORTANTE: os preços e prazos abaixo são TABELAS ESTIMADAS, não cotações
 * reais dos Correios. Cotação em tempo real exige contrato com os Correios ou
 * uma API como Melhor Envio. Ajuste os valores nas tabelas `CORREIOS_RATES` e
 * `LOCAL_RATES` conforme o que a loja realmente paga.
 */

export const SHIPPING_ORIGIN = { city: "Atibaia", state: "SP" } as const;

export type ShippingMethodId = "pac" | "sedex" | "mini" | "same_day" | "next_day";

export type ShippingOption = {
  id: ShippingMethodId;
  label: string;
  description: string;
  price: number;
  /** Texto do prazo, ex.: "3 a 5 dias úteis". */
  deadline: string;
};

type Zone =
  | "same_city"
  | "region"
  | "sp"
  | "sudeste"
  | "sul"
  | "centro_oeste"
  | "nordeste"
  | "norte";

// ---------------------------------------------------------------------------
// CEP -> UF (faixas oficiais dos Correios)
// ---------------------------------------------------------------------------

const CEP_RANGES: [start: number, end: number, uf: string][] = [
  [1000000, 19999999, "SP"],
  [20000000, 28999999, "RJ"],
  [29000000, 29999999, "ES"],
  [30000000, 39999999, "MG"],
  [40000000, 48999999, "BA"],
  [49000000, 49999999, "SE"],
  [50000000, 56999999, "PE"],
  [57000000, 57999999, "AL"],
  [58000000, 58999999, "PB"],
  [59000000, 59999999, "RN"],
  [60000000, 63999999, "CE"],
  [64000000, 64999999, "PI"],
  [65000000, 65999999, "MA"],
  [66000000, 68899999, "PA"],
  [68900000, 68999999, "AP"],
  [69000000, 69299999, "AM"],
  [69300000, 69399999, "RR"],
  [69400000, 69899999, "AM"],
  [69900000, 69999999, "AC"],
  [70000000, 72799999, "DF"],
  [72800000, 72999999, "GO"],
  [73000000, 73699999, "DF"],
  [73700000, 76799999, "GO"],
  [76800000, 76999999, "RO"],
  [77000000, 77999999, "TO"],
  [78000000, 78899999, "MT"],
  [79000000, 79999999, "MS"],
  [80000000, 87999999, "PR"],
  [88000000, 89999999, "SC"],
  [90000000, 99999999, "RS"],
];

export function ufFromCep(cep: string): string | null {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const value = Number(digits);
  return CEP_RANGES.find(([start, end]) => value >= start && value <= end)?.[2] ?? null;
}

const ATIBAIA_CEP_START = 12940000;
const ATIBAIA_CEP_END = 12954999;

/** Cidades vizinhas de Atibaia atendidas pela entrega local (motoboy). */
const REGION_CITIES = new Set([
  "bom jesus dos perdoes",
  "nazare paulista",
  "jarinu",
  "piracaia",
  "braganca paulista",
  "mairipora",
  "itatiba",
  "campo limpo paulista",
]);

function normalizeCity(city: string | undefined): string {
  return (city ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

const ZONE_BY_UF: Record<string, Zone> = {
  SP: "sp",
  RJ: "sudeste",
  MG: "sudeste",
  ES: "sudeste",
  PR: "sul",
  SC: "sul",
  RS: "sul",
  DF: "centro_oeste",
  GO: "centro_oeste",
  MT: "centro_oeste",
  MS: "centro_oeste",
  BA: "nordeste",
  SE: "nordeste",
  AL: "nordeste",
  PE: "nordeste",
  PB: "nordeste",
  RN: "nordeste",
  CE: "nordeste",
  PI: "nordeste",
  MA: "nordeste",
  AC: "norte",
  AM: "norte",
  AP: "norte",
  PA: "norte",
  RO: "norte",
  RR: "norte",
  TO: "norte",
};

export function resolveZone(cep: string, city?: string): { zone: Zone; state: string } | null {
  const state = ufFromCep(cep);
  if (!state) return null;

  const cepValue = Number(cep.replace(/\D/g, ""));
  if (
    (cepValue >= ATIBAIA_CEP_START && cepValue <= ATIBAIA_CEP_END) ||
    (state === "SP" && normalizeCity(city) === "atibaia")
  ) {
    return { zone: "same_city", state };
  }
  if (state === "SP" && REGION_CITIES.has(normalizeCity(city))) {
    return { zone: "region", state };
  }
  return { zone: ZONE_BY_UF[state] ?? "norte", state };
}

// ---------------------------------------------------------------------------
// Tabelas de preço e prazo (ESTIMADAS — ajuste conforme o contrato real)
// ---------------------------------------------------------------------------

type Rate = { price: number; days: [min: number, max: number] };
type CorreiosZone = Exclude<Zone, "same_city" | "region"> | "same_city" | "region";

const CORREIOS_RATES: Record<"pac" | "sedex", Record<CorreiosZone, Rate>> = {
  pac: {
    same_city: { price: 16.9, days: [2, 4] },
    region: { price: 17.9, days: [2, 4] },
    sp: { price: 21.9, days: [3, 5] },
    sudeste: { price: 26.9, days: [4, 7] },
    sul: { price: 31.9, days: [5, 9] },
    centro_oeste: { price: 34.9, days: [5, 9] },
    nordeste: { price: 39.9, days: [7, 12] },
    norte: { price: 49.9, days: [8, 14] },
  },
  sedex: {
    same_city: { price: 27.9, days: [1, 2] },
    region: { price: 29.9, days: [1, 2] },
    sp: { price: 34.9, days: [1, 3] },
    sudeste: { price: 39.9, days: [2, 3] },
    sul: { price: 49.9, days: [2, 4] },
    centro_oeste: { price: 54.9, days: [3, 5] },
    nordeste: { price: 64.9, days: [3, 6] },
    norte: { price: 79.9, days: [4, 8] },
  },
};

/**
 * Mini Envios (PAC Mini): pacotes pequenos e leves, e SOMENTE para clientes da
 * mesma cidade da loja (Atibaia-SP).
 */
const MINI_ENVIOS_RATE: Rate = { price: 11.9, days: [3, 5] };

/** Entrega local por motoboy/app de entrega (Lalamove, Borzoi etc.). */
const LOCAL_RATES = {
  same_city: { same_day: 14.9, next_day: 9.9 },
  region: { same_day: 24.9, next_day: 16.9 },
} as const;

/** Mini Envios só vale para pedidos de até este total de unidades. */
export const MINI_ENVIOS_MAX_UNITS = 3;

/** Pedidos feitos até esta hora (Brasília) ainda saem no mesmo dia. */
const SAME_DAY_CUTOFF_HOUR = 14;

function formatDays([min, max]: [number, number]): string {
  return min === max ? `${min} dia útil` : `${min} a ${max} dias úteis`;
}

function canDeliverSameDay(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  return weekday !== "Sun" && hour < SAME_DAY_CUTOFF_HOUR;
}

export type ShippingQuote = {
  state: string;
  zone: Zone;
  options: ShippingOption[];
};

/**
 * Opções de envio disponíveis para o destino. `city` só importa para
 * reconhecer Atibaia e as cidades da região; o estado vem sempre do CEP.
 */
export function getShippingOptions(params: {
  cep: string;
  city?: string;
  totalUnits: number;
  now?: Date;
}): ShippingQuote | null {
  const resolved = resolveZone(params.cep, params.city);
  if (!resolved) return null;
  const { zone, state } = resolved;

  const options: ShippingOption[] = [];

  const pac = CORREIOS_RATES.pac[zone];
  options.push({
    id: "pac",
    label: "PAC (Envio Normal)",
    description: "Correios — opção mais econômica.",
    price: pac.price,
    deadline: formatDays(pac.days),
  });

  const sedex = CORREIOS_RATES.sedex[zone];
  options.push({
    id: "sedex",
    label: "SEDEX (Envio Expresso)",
    description: "Correios — entrega mais rápida.",
    price: sedex.price,
    deadline: formatDays(sedex.days),
  });

  if (zone === "same_city" && params.totalUnits <= MINI_ENVIOS_MAX_UNITS) {
    options.push({
      id: "mini",
      label: "Mini Envios (PAC Mini)",
      description: "Correios — para pedidos pequenos e leves (clientes de Atibaia).",
      price: MINI_ENVIOS_RATE.price,
      deadline: formatDays(MINI_ENVIOS_RATE.days),
    });
  }

  if (zone === "same_city" || zone === "region") {
    const local = LOCAL_RATES[zone];
    if (canDeliverSameDay(params.now ?? new Date())) {
      options.push({
        id: "same_day",
        label: "Entrega no mesmo dia",
        description: "Motoboy ou app de entrega rápida (Lalamove/Borzoi). Pedido até as 14h.",
        price: local.same_day,
        deadline: "hoje",
      });
    }
    options.push({
      id: "next_day",
      label: "Entrega no dia seguinte",
      description: "Motoboy ou app de entrega rápida (Lalamove/Borzoi).",
      price: local.next_day,
      deadline: "amanhã",
    });
  }

  return { state, zone, options };
}
