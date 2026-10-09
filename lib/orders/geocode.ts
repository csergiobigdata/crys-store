import "server-only";

export type Coordinates = { lat: number; lng: number };

export type AddressHint = { street?: string; city?: string; state?: string };

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

/**
 * Coordenadas do CEP (nível de rua) pela AwesomeAPI.
 * Atenção: a BrasilAPI NÃO serve aqui — ela devolve o centro da cidade para
 * todo CEP, o que daria distância ~0 km para qualquer endereço da cidade.
 */
async function fromAwesomeApi(cep: string): Promise<Coordinates | null> {
  const response = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  });
  if (!response.ok) {
    console.error(`AwesomeAPI respondeu ${response.status} para o CEP ${cep}`);
    return null;
  }
  const data = await response.json();
  return parseCoordinates(data.lat, data.lng);
}

/** Coordenadas da rua pelo OpenStreetMap (Nominatim), usado quando o CEP não tem coordenadas. */
async function fromNominatim(address: AddressHint): Promise<Coordinates | null> {
  if (!address.street || !address.city) return null;
  const params = new URLSearchParams({
    street: address.street,
    city: address.city,
    country: "Brazil",
    format: "json",
    limit: "1",
  });
  if (address.state) params.set("state", address.state);

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    // A política de uso do Nominatim exige um User-Agent que identifique o app.
    headers: { "User-Agent": "ChrysStore/1.0 (chrysstoreapp@gmail.com)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  });
  if (!response.ok) {
    console.error(`Nominatim respondeu ${response.status}`);
    return null;
  }
  const data = (await response.json()) as { lat?: string; lon?: string }[];
  return parseCoordinates(data[0]?.lat, data[0]?.lon);
}

/**
 * Coordenadas aproximadas de um endereço brasileiro, consultadas no servidor:
 * primeiro o CEP (AwesomeAPI) e, se não houver, a rua (OpenStreetMap).
 * `null` quando nenhum provedor soube localizar — quem chama deve tratar isso
 * como "distância desconhecida", nunca como distância zero.
 */
export async function geocodeAddress(cep: string, address?: AddressHint): Promise<Coordinates | null> {
  const digits = cep.replace(/\D/g, "");

  if (digits.length === 8) {
    try {
      const result = await fromAwesomeApi(digits);
      if (result) return result;
    } catch (error) {
      console.error("Falha ao localizar o CEP no mapa (AwesomeAPI):", error);
    }
  }

  if (address) {
    try {
      return await fromNominatim(address);
    } catch (error) {
      console.error("Falha ao localizar a rua no mapa (Nominatim):", error);
    }
  }
  return null;
}

/** Atalho para quando só há o CEP (ex.: CEP da loja nas configurações). */
export async function geocodeCep(cep: string): Promise<Coordinates | null> {
  return geocodeAddress(cep);
}
