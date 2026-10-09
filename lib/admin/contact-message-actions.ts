"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

/** Marca (ou desmarca) uma mensagem do Fale Conosco como lida. */
export async function setMessageReadAction(messageId: string, read: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase
    .from("contact_messages")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", messageId);
  revalidatePath("/admin/mensagens");
}

/** Exclui uma mensagem (ação do próprio administrador, depois de resolvida). */
export async function deleteMessageAction(messageId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("contact_messages").delete().eq("id", messageId);
  revalidatePath("/admin/mensagens");
}
