"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createPaymentClient } from "@/lib/mercadopago/client";
import { getMaxInstallments } from "@/lib/mercadopago/settings";
import { getOrderForViewing } from "@/lib/orders/get-order";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type CardPaymentResult =
  | { status: "approved"; message: string }
  | { status: "in_process"; message: string }
  | { status: "rejected"; message: string }
  | { status: "error"; message: string };

export async function createCardPayment(params: {
  orderNumber: string;
  token: string;
  cardToken: string;
  issuerId: string;
  paymentMethodId: string;
  installments: number;
}): Promise<CardPaymentResult> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const allowed = await checkRateLimit({
    bucket: "card_payment",
    identifier: ip,
    maxAttempts: 15,
    windowMinutes: 15,
  });
  if (!allowed) {
    return {
      status: "error",
      message: "Muitas tentativas de pagamento. Aguarde alguns minutos e tente novamente.",
    };
  }

  const order = await getOrderForViewing(params.orderNumber, params.token);
  if (!order) {
    return { status: "error", message: "Pedido não encontrado." };
  }
  if (
    order.payment_method !== "cartao" ||
    !["aguardando_pagamento", "pagamento_recusado"].includes(order.status)
  ) {
    return { status: "error", message: "Este pedido não pode mais receber pagamento por cartão." };
  }

  const maxInstallments = await getMaxInstallments();
  const installments = Math.min(Math.max(1, params.installments || 1), maxInstallments);

  // Idempotency key único por tentativa — nunca reaproveitado entre chamadas.
  const idempotencyKey = randomUUID();
  const paymentClient = createPaymentClient(idempotencyKey);

  let response;
  try {
    response = await paymentClient.create({
      body: {
        // Valor sempre recalculado a partir do pedido no banco — o que o
        // navegador envia (se enviasse) seria ignorado.
        transaction_amount: order.total,
        token: params.cardToken,
        description: `Pedido ${order.order_number} — Chrys Store`,
        installments,
        payment_method_id: params.paymentMethodId,
        issuer_id: Number(params.issuerId) || undefined,
        external_reference: order.id,
        payer: {
          email: order.guest_email ?? undefined,
          identification: order.guest_cpf
            ? { type: "CPF", number: order.guest_cpf }
            : undefined,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao criar pagamento Mercado Pago:", error);
    return {
      status: "error",
      message: "Não foi possível processar o pagamento agora. Tente novamente.",
    };
  }

  const supabase = createAdminClient();
  await supabase.rpc("record_mercadopago_payment_result", {
    p_order_id: order.id,
    p_mp_payment_id: response.id ? String(response.id) : null,
    p_status: response.status ?? "pending",
    p_status_detail: response.status_detail ?? null,
    p_idempotency_key: idempotencyKey,
    p_installments: installments,
    p_raw_payload: null,
  });

  revalidatePath(`/pedidos/${order.order_number}`);

  if (response.status === "approved") {
    return { status: "approved", message: "Pagamento aprovado! Já estamos preparando seu pedido." };
  }
  if (response.status === "rejected") {
    return { status: "rejected", message: friendlyRejectionMessage(response.status_detail) };
  }
  return {
    status: "in_process",
    message: "Pagamento em processamento. Avisaremos por e-mail quando confirmar.",
  };
}

function friendlyRejectionMessage(detail?: string | null): string {
  switch (detail) {
    case "cc_rejected_insufficient_amount":
      return "Cartão recusado por saldo/limite insuficiente.";
    case "cc_rejected_bad_filled_security_code":
      return "Código de segurança (CVV) incorreto.";
    case "cc_rejected_bad_filled_date":
      return "Data de validade do cartão incorreta.";
    case "cc_rejected_bad_filled_other":
    case "cc_rejected_bad_filled_card_number":
      return "Dados do cartão incorretos. Revise e tente novamente.";
    case "cc_rejected_call_for_authorize":
      return "Seu banco exige autorização para este pagamento. Entre em contato com ele ou tente outro cartão.";
    case "cc_rejected_card_disabled":
      return "Cartão desabilitado. Entre em contato com seu banco ou tente outro cartão.";
    case "cc_rejected_duplicated_payment":
      return "Já identificamos um pagamento igual recente para este pedido.";
    case "cc_rejected_high_risk":
    case "cc_rejected_other_reason":
      return "Pagamento não autorizado. Tente outro cartão ou escolha Pix.";
    default:
      return "Pagamento recusado. Tente outro cartão ou escolha Pix.";
  }
}
