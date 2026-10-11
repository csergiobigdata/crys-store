import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const SALES_PAUSED_KEY = "sales_paused";

export const SALES_PAUSED_ORDER_ERROR =
  "As vendas estão pausadas temporariamente pelo administrador. Você pode continuar navegando; em caso de dúvida, fale conosco.";

/**
 * Vendas pausadas pelo administrador (Configurações). Lê com a service role
 * porque a chave não é pública no RLS e o visitante precisa saber do aviso.
 */
export async function areSalesPaused(): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SALES_PAUSED_KEY)
    .maybeSingle();

  const value = data?.value as { paused?: boolean } | boolean | null | undefined;
  return typeof value === "object" && value !== null ? value.paused === true : value === true;
}
