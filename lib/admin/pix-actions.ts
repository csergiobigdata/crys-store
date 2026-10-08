"use server";

import { revalidatePath } from "next/cache";
import { getOrderContactEmail } from "@/lib/admin/order-contact";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendPaymentConfirmedEmail } from "@/lib/email/notify-customer";
import { createAdminClient } from "@/lib/supabase/admin";

export async function confirmPixPaymentAction(orderId: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: ok } = await supabase.rpc("confirm_pix_payment", {
    p_order_id: orderId,
    p_admin_id: admin.id,
  });

  if (!ok) {
    return { error: "Não foi possível confirmar este pedido." };
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "order",
    entity_id: orderId,
    action: "confirm_pix_payment",
  });

  const contact = await getOrderContactEmail(orderId);
  if (contact?.email) {
    await sendPaymentConfirmedEmail({
      to: contact.email,
      orderNumber: contact.orderNumber,
      accessToken: contact.accessToken,
    });
  }

  revalidatePath("/admin/pedidos");
  if (contact) revalidatePath(`/pedidos/${contact.orderNumber}`);

  return { success: true };
}

export async function rejectPixPaymentAction(orderId: string, formData: FormData) {
  const note = String(formData.get("note") ?? "");
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("order_number")
    .eq("id", orderId)
    .maybeSingle();

  const { data: ok } = await supabase.rpc("reject_pix_payment", {
    p_order_id: orderId,
    p_admin_id: admin.id,
    p_note: note || null,
  });

  if (!ok) {
    return { error: "Não foi possível recusar este pedido." };
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "order",
    entity_id: orderId,
    action: "reject_pix_payment",
    changes: { note },
  });

  revalidatePath("/admin/pedidos");
  if (order) revalidatePath(`/pedidos/${order.order_number}`);

  return { success: true };
}
