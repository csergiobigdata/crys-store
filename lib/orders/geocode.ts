import "server-only";

export type Coordinates = { lat: number; lng: number };

const TIMEOUT_MS = 4000;
// Um CEP não muda de lugar: pode ficar em cache por bastante tempo.
const CACHE_SECONDS = 60 * 60 * 24 * 30;

function parseCoordinates(lat: unknown, lng: unknown): Coordinates | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  // Caixa aproximada do Brasil: descarta respostas zeradas ou fora do país.
  if (latitude < -34 || latitude > 6 || longitude < -74 || longitude > -28) return null;
  return { lat: latitude, lng: longitude };
}

async function fromAwesomeApi(cep: string): Promise<Coordinates | null> {
  const response = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return parseCoordinates(data.lat, data.lng);
}

async function fromBrasilApi(cep: string): Promise<Coordinates | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const coordinates = data.location?.coordinates;
  return parseCoordinates(coordinates?.latitude, coordinates?.longitude);
}

/**
 * Coordenadas aproximadas de um CEP, consultadas no servidor (AwesomeAPI e,
 * como reserva, BrasilAPI). `null` quando nenhum provedor soube localizar.
 */
export async function geocodeCep(cep: string): Promise<Coordinates | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  for (const provider of [fromAwesomeApi, fromBrasilApi]) {
    try {
      const result = await provider(digits);
      if (result) return result;
    } catch (error) {
      console.error("Falha ao localizar CEP no mapa:", error);
    }
  }
  return null;
}
