import { getPixEnv } from "@/lib/pix/env";
import { createClient } from "@/lib/supabase/server";

/**
 * app_settings guarda o valor efetivo (editável pelo admin em runtime);
 * o .env é só o padrão de deploy.
 */
export async function getPixExpirationHours(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "pix_expiration_hours")
    .maybeSingle();

  const parsed = Number(data?.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : getPixEnv().PIX_EXPIRATION_HOURS;
}
