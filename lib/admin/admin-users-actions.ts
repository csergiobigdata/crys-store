"use server";

import { revalidatePath } from "next/cache";
import { requirePrimaryAdmin } from "@/lib/auth/require-admin";
import { MAX_ADMINS } from "@/lib/admin/admin-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUsersState = { error?: string; success?: string } | undefined;

/** Procura um usuário cadastrado pelo e-mail (a loja é pequena: poucas centenas de contas). */
async function findUserByEmail(email: string) {
  const supabase = createAdminClient();
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const found = data.users.find((user) => user.email?.toLowerCase() === wanted);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

async function countAdmins() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return count ?? 0;
}

async function audit(actorId: string, entityId: string, action: string, changes: object) {
  const supabase = createAdminClient();
  await supabase.from("audit_log").insert({
    actor_profile_id: actorId,
    entity_type: "profile",
    entity_id: entityId,
    action,
    changes,
  });
}

/** Promove um usuário já cadastrado a administrador (limite de MAX_ADMINS). */
export async function addAdminAction(
  _prevState: AdminUsersState,
  formData: FormData,
): Promise<AdminUsersState> {
  const actor = await requirePrimaryAdmin();
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Informe o e-mail do usuário." };

  if ((await countAdmins()) >= MAX_ADMINS) {
    return { error: `Limite atingido: a loja pode ter no máximo ${MAX_ADMINS} administradores.` };
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return {
      error:
        "Nenhum usuário cadastrado com este e-mail. Peça para a pessoa criar a conta no site primeiro.",
    };
  }
  if (!user.email_confirmed_at) {
    return { error: "Este usuário ainda não confirmou o e-mail da conta." };
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { error: "Perfil do usuário não encontrado." };
  if (profile.role === "admin") return { error: "Este usuário já é administrador." };

  const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
  if (error) {
    return {
      error: error.message.includes("max_admins_reached")
        ? `Limite atingido: no máximo ${MAX_ADMINS} administradores.`
        : "Não foi possível tornar este usuário administrador.",
    };
  }

  await audit(actor.id, user.id, "add_admin", { email: user.email });
  revalidatePath("/admin/administradores");
  return { success: `${user.email} agora é administrador.` };
}

/** Remove o papel de administrador (o principal não pode ser removido). */
export async function removeAdminAction(profileId: string): Promise<AdminUsersState> {
  const actor = await requirePrimaryAdmin();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_primary_admin")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return { error: "Administrador não encontrado." };
  if (profile.is_primary_admin) {
    return { error: "O administrador principal não pode ser removido. Passe a função a outro antes." };
  }

  const { error } = await supabase.from("profiles").update({ role: "cliente" }).eq("id", profileId);
  if (error) return { error: "Não foi possível remover o administrador." };

  await audit(actor.id, profileId, "remove_admin", {});
  revalidatePath("/admin/administradores");
  return { success: "Administrador removido." };
}

/** Passa a função de administrador principal para outro administrador. */
export async function makePrimaryAdminAction(profileId: string): Promise<AdminUsersState> {
  const actor = await requirePrimaryAdmin();
  const supabase = createAdminClient();

  const { data: ok } = await supabase.rpc("set_primary_admin", { p_new_primary: profileId });
  if (!ok) return { error: "Não foi possível definir o administrador principal." };

  await audit(actor.id, profileId, "set_primary_admin", {});
  revalidatePath("/admin/administradores");
  revalidatePath("/", "layout");
  return { success: "Administrador principal alterado." };
}
