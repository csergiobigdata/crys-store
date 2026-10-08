import "server-only";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { getMpEnv } from "@/lib/mercadopago/env";

/**
 * Valida a assinatura x-signature de uma notificação do Mercado Pago,
 * usando o validador oficial do SDK (HMAC-SHA256 sobre
 * `id:{data.id};request-id:{x-request-id};ts:{ts};`, comparado em tempo
 * constante). Retorna false em qualquer falha, sem lançar.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  try {
    WebhookSignatureValidator.validate({
      xSignature: params.xSignature,
      xRequestId: params.xRequestId,
      dataId: params.dataId,
      secret: getMpEnv().MP_WEBHOOK_SECRET,
      toleranceSeconds: 300,
    });
    return true;
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      console.error("Webhook Mercado Pago rejeitado — assinatura inválida:", error.reason);
    }
    return false;
  }
}
