import "server-only";

export type CepAddress = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

/** `null` = CEP não existe; lança se nenhum provedor respondeu. */
type ProviderResult = CepAddress | null;

const TIMEOUT_MS = 4000;

async function fromViaCep(cep: string): Promise<ProviderResult> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`viacep ${response.status}`);
  const data = await response.json();
  if (data.erro) return null;
  return {
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}

async function fromBrasilApi(cep: string): Promise<ProviderResult> {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`brasilapi ${response.status}`);
  const data = await response.json();
  return {
    street: data.street ?? "",
    neighborhood: data.neighborhood ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
  };
}

/**
 * Consulta o endereço de um CEP no servidor (o navegador não pode chamar
 * serviços de CEP diretamente por causa da CSP em next.config.ts). Tenta o
 * ViaCEP e, se ele estiver fora do ar, a BrasilAPI.
 *
 * Retorna `{ status: "not_found" }` quando o CEP não existe e
 * `{ status: "unavailable" }` quando nenhum provedor respondeu.
 */
export async function lookupCepAddress(
  cep: string,
): Promise<
  | { status: "ok"; address: CepAddress }
  | { status: "not_found" }
  | { status: "unavailable" }
> {
  for (const provider of [fromViaCep, fromBrasilApi]) {
    try {
      const result = await provider(cep);
      return result ? { status: "ok", address: result } : { status: "not_found" };
    } catch (error) {
      console.error("Falha ao consultar CEP:", error);
    }
  }
  return { status: "unavailable" };
}
