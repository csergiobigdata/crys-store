import "server-only";
import { getPixEnv } from "@/lib/pix/env";
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
  return {
    pixKey: env.PIX_KEY,
    merchantName: env.PIX_MERCHANT_NAME,
    merchantCity: env.PIX_MERCHANT_CITY,
  };
}
