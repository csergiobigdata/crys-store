"use server";

import { revalidatePath } from "next/cache";
import { getOrderContactEmail } from "@/lib/admin/order-contact";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendOrderShippedEmail } from "@/lib/email/notify-customer";
import { createAdminClient } from "@/lib/supabase/admin";

export async function cancelOrderAction(orderId: string, formData: FormData) {
  const admin = await requireAdmin();
  const note = String(formData.get("note") ?? "");
  const supabase = createAdminClient();

  const { data: ok } = await supabase.rpc("admin_cancel_order", {
    p_order_id: orderId,
    p_admin_id: admin.id,
    p_note: note || null,
  });

  if (!ok) {
    return { error: "Não foi possível cancelar este pedido." };
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "order",
    entity_id: orderId,
    action: "cancel_order",
    changes: { note },
  });

  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function markOrderShippedAction(orderId: string, formData: FormData) {
  const admin = await requireAdmin();
  const trackingCode = String(formData.get("trackingCode") ?? "").trim();
  const carrier = String(formData.get("carrier") ?? "").trim();

  if (!trackingCode) {
    return { error: "Informe o código de rastreio." };
  }

  const supabase = createAdminClient();
  const { data: ok } = await supabase.rpc("admin_mark_order_shipped", {
    p_order_id: orderId,
    p_admin_id: admin.id,
    p_tracking_code: trackingCode,
    p_carrier: carrier || null,
  });

  if (!ok) {
    return { error: "Não foi possível marcar este pedido como enviado." };
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "order",
    entity_id: orderId,
    action: "mark_order_shipped",
    changes: { trackingCode, carrier },
  });

  const contact = await getOrderContactEmail(orderId);
  if (contact?.email) {
    await sendOrderShippedEmail({
      to: contact.email,
      orderNumber: contact.orderNumber,
      accessToken: contact.accessToken,
      trackingCode,
      carrier: carrier || null,
    });
  }

  revalidatePath("/admin/pedidos");
  if (contact) revalidatePath(`/pedidos/${contact.orderNumber}`);

  return { success: true };
}
