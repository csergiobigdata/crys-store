"use server";

import { revalidatePath } from "next/cache";
import { getOrderContactEmail } from "@/lib/admin/order-contact";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getCancellationReasonLabel } from "@/lib/orders/cancellation-reasons";
import { sendOrderShippedEmail } from "@/lib/email/notify-customer";
import { createAdminClient } from "@/lib/supabase/admin";

export async function cancelOrderAction(
  orderId: string,
  input: { reason: string; note?: string },
): Promise<{ error?: string; success?: boolean }> {
  const admin = await requireAdmin();
  const reasonLabel = getCancellationReasonLabel(input.reason);
  const note = (input.note ?? "").trim();

  if (!reasonLabel) {
    return { error: "Selecione a justificativa do cancelamento." };
  }
  if (input.reason === "outro" && !note) {
    return { error: "Descreva o motivo do cancelamento." };
  }
  if (note.length > 500) {
    return { error: "A observação deve ter no máximo 500 caracteres." };
  }

  const supabase = createAdminClient();
  const { data: ok } = await supabase.rpc("admin_cancel_order", {
    p_order_id: orderId,
    p_admin_id: admin.id,
    p_reason: reasonLabel,
    p_note: note || null,
  });

  if (!ok) {
    return { error: "Não foi possível cancelar este pedido (o status dele pode ter mudado)." };
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "order",
    entity_id: orderId,
    action: "cancel_order",
    changes: { reason: reasonLabel, note: note || null },
  });

  const contact = await getOrderContactEmail(orderId);
  revalidatePath("/admin/pedidos");
  if (contact) {
    revalidatePath(`/admin/pedidos/${contact.orderNumber}`);
    revalidatePath(`/pedidos/${contact.orderNumber}`);
  }
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
