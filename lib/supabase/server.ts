import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a anon key (sujeito a RLS) — para operações que precisam ignorar RLS
 * (gerar Pix, criar pagamento, mover estoque), use lib/supabase/admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita de
            // cookies — inofensivo, pois o proxy.ts já renova a sessão.
          }
        },
      },
    },
  );
}
