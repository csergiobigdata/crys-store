import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPhone } from "@/lib/utils/format";

export type PrimaryAdminContact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

/**
 * Contato do administrador principal: é o único contato público da loja (rodapé
 * "Atendimento" e janela "Sobre"). Se por algum motivo nenhum perfil estiver
 * marcado como principal, usa o administrador mais antigo.
 */
export async function getPrimaryAdminContact(): Promise<PrimaryAdminContact | null> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, nickname, phone")
    .eq("role", "admin")
    .order("is_primary_admin", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile) return null;

  const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
  return {
    id: profile.id,
    name: profile.full_name ?? profile.nickname ?? null,
    email: authUser.user?.email ?? null,
    phone: formatPhone(profile.phone),
  };
}

/** E-mails de todos os administradores (destino do "Fale Conosco"). */
export async function getAllAdminEmails(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");

  const emails = await Promise.all(
    (admins ?? []).map(async (admin) => {
      const { data } = await supabase.auth.admin.getUserById(admin.id);
      return data.user?.email ?? null;
    }),
  );
  return [...new Set(emails.filter((email): email is string => Boolean(email)))];
}
