"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/auth";

export type ProfileFormState = { error?: string; saved?: boolean } | undefined;

/**
 * Atualiza nome e apelido ("como você quer ser chamado") do usuário logado.
 * Usa a sessão do próprio usuário, então o RLS garante que ele só altera o
 * próprio perfil.
 */
export async function saveProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    nickname: formData.get("nickname") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados do formulário." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      nickname: parsed.data.nickname || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Não foi possível salvar seus dados. Tente novamente." };

  // O nome aparece no cabeçalho de todas as páginas.
  revalidatePath("/", "layout");
  return { saved: true };
}
