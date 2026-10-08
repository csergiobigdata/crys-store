import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getOrderContactEmail } from "@/lib/admin/order-contact";
import { sendPaymentConfirmedEmail } from "@/lib/email/notify-customer";
import { createPaymentClient } from "@/lib/mercadopago/client";
import { verifyWebhookSignature } from "@/lib/mercadopago/verify-webhook-signature";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook do Mercado Pago (item 6 da especificação):
 * 1. Valida a assinatura x-signature com o segredo configurado.
 * 2. NUNCA confia no status do corpo da notificação — consulta a API do
 *    Mercado Pago para saber o status real do pagamento.
 * 3. Processa via record_mercadopago_payment_result, que é idempotente:
 *    notificações repetidas não alteram o pedido duas vezes.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const signatureValid = verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });

  if (!signatureValid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paymentId = dataId ?? body?.data?.id;

  if (!paymentId) {
    return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });
  }

  const paymentClient = createPaymentClient();
  let payment;
  try {
    payment = await paymentClient.get({ id: paymentId });
  } catch (error) {
    console.error("Erro ao consultar pagamento no Mercado Pago:", error);
    return NextResponse.json({ error: "payment_lookup_failed" }, { status: 502 });
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  // Pix criado pela API: confirma o pedido (idempotente) e avisa o cliente.
  if (payment.payment_method_id === "pix") {
    const { data: result } = await supabase.rpc("confirm_pix_payment_by_mp", {
      p_order_id: orderId,
      p_mp_payment_id: String(payment.id),
      p_status: payment.status ?? "pending",
    });
    if (result === "pago") {
      const contact = await getOrderContactEmail(orderId);
      if (contact?.email) {
        await sendPaymentConfirmedEmail({
          to: contact.email,
          orderNumber: contact.orderNumber,
          accessToken: contact.accessToken,
        });
      }
      if (contact) revalidatePath(`/pedidos/${contact.orderNumber}`);
    } else if (result === "late_payment") {
      console.error(`Pix ${payment.id} aprovado após o pedido ${orderId} expirar — ação manual necessária.`);
    }
    return NextResponse.json({ ok: true });
  }

  await supabase.rpc("record_mercadopago_payment_result", {
    p_order_id: orderId,
    p_mp_payment_id: payment.id ? String(payment.id) : null,
    p_status: payment.status ?? "pending",
    p_status_detail: payment.status_detail ?? null,
    p_idempotency_key: null,
    p_installments: null,
    p_raw_payload: body,
  });

  return NextResponse.json({ ok: true });
}
