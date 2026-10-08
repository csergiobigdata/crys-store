import "server-only";
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";
import { getMpEnv } from "@/lib/mercadopago/env";

function config(idempotencyKey?: string) {
  return new MercadoPagoConfig({
    accessToken: getMpEnv().MP_ACCESS_TOKEN,
    options: idempotencyKey ? { idempotencyKey } : undefined,
  });
}

export function createPaymentClient(idempotencyKey?: string) {
  return new Payment(config(idempotencyKey));
}

export function createPaymentRefundClient() {
  return new PaymentRefund(config());
}
