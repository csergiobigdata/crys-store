import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitParams = {
  bucket: string;
  identifier: string;
  maxAttempts: number;
  windowMinutes: number;
};

/**
 * Checa e registra uma tentativa em `rate_limit_hits` via a função
 * `check_rate_limit` (RPC com SECURITY DEFINER). Retorna false quando o
 * limite da janela já foi atingido. Em caso de falha de infraestrutura,
 * falha "aberta" (não bloqueia o usuário) e loga o erro para investigação.
 */
export async function checkRateLimit({
  bucket,
  identifier,
  maxAttempts,
  windowMinutes,
}: RateLimitParams): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_identifier: identifier,
    p_max_attempts: maxAttempts,
    p_window_minutes: windowMinutes,
  });

  if (error) {
    console.error("Erro ao checar rate limit:", error.message);
    return true;
  }

  return Boolean(data);
}
