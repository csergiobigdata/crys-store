"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin/product-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { couponSchema } from "@/lib/validations/admin-product";

export async function upsertCouponAction(
  couponId: string | null,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = couponSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minOrderValue: formData.get("minOrderValue"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil"),
    usageLimit: formData.get("usageLimit"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados do cupom." };
  }

  const supabase = createAdminClient();
  const payload = {
    name: parsed.data.name,
    code: parsed.data.code,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountValue,
    min_order_value: parsed.data.minOrderValue ? Number(parsed.data.minOrderValue) : null,
    valid_from: parsed.data.validFrom ? new Date(parsed.data.validFrom).toISOString() : new Date().toISOString(),
    valid_until: parsed.data.validUntil ? new Date(parsed.data.validUntil).toISOString() : null,
    usage_limit: parsed.data.usageLimit ? Number(parsed.data.usageLimit) : null,
    active: parsed.data.active,
  };

  let id = couponId;
  if (id) {
    const { error } = await supabase.from("coupons").update(payload).eq("id", id);
    if (error) return { error: "Não foi possível salvar (o código já pode estar em uso)." };
  } else {
    const { data, error } = await supabase
      .from("coupons")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      return { error: "Não foi possível criar o cupom (o código já pode estar em uso)." };
    }
    id = data.id;
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "coupon",
    entity_id: id,
    action: couponId ? "update_coupon" : "create_coupon",
    changes: payload,
  });

  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}
