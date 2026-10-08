import { getMpEnv } from "@/lib/mercadopago/env";
import { createClient } from "@/lib/supabase/server";

export async function getMaxInstallments(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "mp_max_installments")
    .maybeSingle();

  const parsed = Number(data?.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : getMpEnv().MP_MAX_INSTALLMENTS;
}
