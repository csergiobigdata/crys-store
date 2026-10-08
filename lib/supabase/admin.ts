import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service role key — ignora RLS. Só pode ser usado
 * em código de servidor (Server Actions / Route Handlers): gerar o Pix,
 * criar/confirmar pagamentos, mover estoque em transação, ler o bucket
 * privado de comprovantes, escrever audit_log. O import "server-only"
 * faz o build falhar se este módulo for puxado para um Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
