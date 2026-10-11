"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/product-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { SALES_PAUSED_KEY } from "@/lib/site/sales-status";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setSalesPausedAction(paused: boolean): Promise<ActionState> {
  const admin = await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: SALES_PAUSED_KEY, value: { paused } });
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "app_settings",
    entity_id: admin.id,
    action: paused ? "pause_sales" : "resume_sales",
    changes: { paused },
  });

  revalidatePath("/", "layout");
  return undefined;
}
