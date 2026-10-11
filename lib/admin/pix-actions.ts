"use server";

import { revalidatePath } from "next/cache";
import { getOrderContactEmail } from "@/lib/admin/order-contact";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendPaymentConfirmedEmail } from "@/lib/email/notify-customer";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeFileExtension } from "@/lib/utils/safe-extension";

export type ConfirmPaymentState = { error?: string; success?: boolean } | undefined;

const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Marca o pagamento Pix como confirmado pelo administrador, com ou sem
 * comprovante anexado (o anexo e a observação são opcionais).
 */
export async function confirmPixPaymentManuallyAction(
  orderId: string,
  _prevState: ConfirmPaymentState,
  formData: FormData,
): Promise<ConfirmPaymentState> {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const file = formData.get("proof");
  const note = String(formData.get("note") ?? "").trim();
  const hasFile = file instanceof File && file.size > 0;

  if (note.length > 300) return { error: "A observação deve ter no máximo 300 caracteres." };
  if (hasFile) {
    if (!PROOF_TYPES.includes(file.type)) {
      return { error: "Envie uma imagem (JPEG, PNG, WebP) ou um PDF." };
    }
    if (file.size > PROOF_MAX_BYTES) return { error: "O comprovante deve ter até 5 MB." };
  }

  let proofPath: string | null = null;
  if (hasFile) {
    proofPath = `${orderId}/admin-${Date.now()}.${safeFileExtension(file.name, "bin")}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(proofPath, file, { contentType: file.type });
    if (uploadError) return { error: "Não foi possível enviar o comprovante. Tente novamente." };
  }

  const { data: ok } = await supabase.rpc("confirm_pix_payment", {
    p_order_id: orderId,
    p_admin_id: admin.id,
  });

  if (!ok) {
    if (proofPath) await supabase.storage.from("payment-proofs").remove([proofPath]);
    return { error: "Não foi possível confirmar este pedido (o status dele pode ter mudado)." };
  }

  if (proofPath) {
    await supabase
      .from("pix_payments")
      .update({ proof_file_path: proofPath, proof_uploaded_at: new Date().toISOString() })
      .eq("order_id", orderId);
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "order",
    entity_id: orderId,
    action: "confirm_pix_payment_manual",
    changes: { with_proof: hasFile, note: note || null },
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
  if (contact) {
    revalidatePath(`/admin/pedidos/${contact.orderNumber}`);
    revalidatePath(`/pedidos/${contact.orderNumber}`);
  }
  return { success: true };
}

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
