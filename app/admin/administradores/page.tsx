import type { Metadata } from "next";
import { AdminUsersPanel, type AdminRow } from "@/components/admin/admins/admin-users-panel";
import { MAX_ADMINS } from "@/lib/admin/admin-limit";
import { requirePrimaryAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPhone } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Administradores — Admin" };

export default async function AdminUsersPage() {
  await requirePrimaryAdmin();

  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, nickname, phone, is_primary_admin, created_at")
    .eq("role", "admin")
    .order("is_primary_admin", { ascending: false })
    .order("created_at", { ascending: true });

  const admins: AdminRow[] = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const { data } = await supabase.auth.admin.getUserById(profile.id);
      const email = data.user?.email ?? null;
      return {
        id: profile.id,
        name: profile.full_name ?? profile.nickname ?? email ?? "Administrador",
        email,
        phone: formatPhone(profile.phone),
        isPrimary: profile.is_primary_admin,
      };
    }),
  );

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-plum">Administradores</h1>
      <p className="mt-2 text-sm text-plum-soft">
        A loja pode ter de 1 até {MAX_ADMINS} administradores ({admins.length} de {MAX_ADMINS}).
        Só o <strong>principal</strong> gerencia esta lista, e o e-mail e o telefone dele são o
        contato público da loja (rodapé e janela &ldquo;Sobre&rdquo;). Todos os administradores
        recebem as mensagens do Fale Conosco.
      </p>
      <AdminUsersPanel admins={admins} maxAdmins={MAX_ADMINS} />
    </div>
  );
}
