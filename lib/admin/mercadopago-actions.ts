"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createPaymentRefundClient } from "@/lib/mercadopago/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function refundCardPaymentAction(orderId: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, payment_method, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.payment_method !== "cartao" || order.status !== "pago") {
    return { error: "Este pedido não pode ser estornado." };
  }

  const { data: mpPayment } = await supabase
    .from("mercadopago_payments")
    .select("mp_payment_id")
    .eq("order_id", orderId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!mpPayment?.mp_payment_id) {
    return { error: "Pagamento aprovado não encontrado para este pedido." };
  }

  try {
    const refundClient = createPaymentRefundClient();
    const refund = await refundClient.total({ payment_id: mpPayment.mp_payment_id });

    await supabase.rpc("record_mercadopago_payment_result", {
      p_order_id: orderId,
      p_mp_payment_id: mpPayment.mp_payment_id,
      p_status: "refunded",
      p_status_detail: refund.status ?? null,
      p_idempotency_key: null,
      p_installments: null,
      p_raw_payload: null,
    });
  } catch (error) {
    console.error("Erro ao estornar pagamento Mercado Pago:", error);
    return { error: "Não foi possível estornar este pagamento." };
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "order",
    entity_id: orderId,
    action: "refund_card_payment",
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/pedidos/${order.order_number}`);

  return { success: true };
}
