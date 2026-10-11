"use server";

import { revalidatePath } from "next/cache";
import { requirePrimaryAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClearAuditState = { error?: string; notice?: string } | undefined;

/**
 * Apaga TODO o log de auditoria. Só o administrador principal faz isso, e só
 * depois de digitar APAGAR. Para não sumir sem rastro, grava-se um único
 * registro novo dizendo quem limpou o log e quantos registros existiam.
 */
export async function clearAuditLogAction(
  _prevState: ClearAuditState,
  formData: FormData,
): Promise<ClearAuditState> {
  const admin = await requirePrimaryAdmin();

  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();
  if (confirmation !== "APAGAR") {
    return { error: 'Digite "APAGAR" para confirmar.' };
  }

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("audit_log")
    .delete({ count: "exact" })
    .not("id", "is", null);

  if (error) {
    return { error: "Não foi possível apagar o log de auditoria agora. Tente novamente." };
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "audit_log",
    entity_id: admin.id,
    action: "clear_audit_log",
    changes: { deleted_records: count ?? 0 },
  });

  revalidatePath("/admin/auditoria");
  return { notice: `Log de auditoria apagado (${count ?? 0} registros).` };
}
