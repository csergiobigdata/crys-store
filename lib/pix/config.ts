import "server-only";
import { getPixEnv } from "@/lib/pix/env";
import { normalizePixKey } from "@/lib/pix/key";
import { createAdminClient } from "@/lib/supabase/admin";

export type PixConfig = {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
};

/**
 * Dados do recebedor usados para gerar o QR Code Pix de cada pedido.
 *
 * Valem os cadastrados pelo admin em /admin/configuracoes (app_settings,
 * chave "pix_config" — que NÃO está na lista de leitura pública do RLS, então
 * só o servidor e o admin enxergam). Se o admin ainda não cadastrou, usa as
 * variáveis PIX_KEY / PIX_MERCHANT_NAME / PIX_MERCHANT_CITY do .env.
 */
export async function getPixConfig(): Promise<PixConfig> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "pix_config")
    .maybeSingle();

  const stored = data?.value as
    | { key?: string; merchant_name?: string; merchant_city?: string }
    | undefined;

  if (stored?.key && stored.merchant_name && stored.merchant_city) {
    return {
      pixKey: stored.key,
      merchantName: stored.merchant_name,
      merchantCity: stored.merchant_city,
    };
  }

  const env = getPixEnv();
  // A chave do .env pode vir como o cliente digita (ex. "11 98649-3333");
  // o BR Code exige o formato normalizado (ex. "+5511986493333").
  return {
    pixKey: normalizePixKey(env.PIX_KEY)?.key ?? env.PIX_KEY,
    merchantName: env.PIX_MERCHANT_NAME,
    merchantCity: env.PIX_MERCHANT_CITY,
  };
}
