import "server-only";
import { createPaymentClient } from "@/lib/mercadopago/client";
import { getPixConfig } from "@/lib/pix/config";
import { buildPixPayload } from "@/lib/pix/payload";
import { sanitizeTxid } from "@/lib/pix/text";
import { createAdminClient } from "@/lib/supabase/admin";

/** Formata em horário de Brasília (-03:00), formato exigido pelo Mercado Pago. */
function toBrasiliaIso(date: Date): string {
  const shifted = new Date(date.getTime() - 3 * 36e5);
  return `${shifted.toISOString().slice(0, 23)}-03:00`;
}

/**
 * Cria um Pix dinâmico no Mercado Pago (QR único, vencimento igual ao do
 * pedido). A confirmação chega pelo webhook — ver app/api/webhooks/mercadopago.
 * Retorna null se o Mercado Pago não estiver configurado ou falhar, para o
 * chamador cair no Pix estático.
 */
async function createMercadoPagoPix(params: {
  orderId: string;
  orderNumber: string;
  total: number;
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  expiresAt: Date | null;
}) {
  if (!process.env.MP_ACCESS_TOKEN) return null;

  try {
    const [firstName, ...rest] = params.payerName.trim().split(/\s+/);
    // Chave por pedido: se a criação for repetida, o MP devolve o mesmo pagamento.
    const payment = await createPaymentClient(`pix-${params.orderId}`).create({
      body: {
        transaction_amount: params.total,
        description: `Pedido ${params.orderNumber} — Chrys Store`,
        payment_method_id: "pix",
        external_reference: params.orderId,
        date_of_expiration: params.expiresAt ? toBrasiliaIso(params.expiresAt) : undefined,
        payer: {
          email: params.payerEmail,
          first_name: firstName,
          last_name: rest.join(" ") || undefined,
          identification: { type: "CPF", number: params.payerCpf },
        },
      },
    });

    const emv = payment.point_of_interaction?.transaction_data?.qr_code;
    if (!payment.id || !emv) {
      console.error("Mercado Pago não devolveu o QR Pix:", payment.status, payment.status_detail);
      return null;
    }
    return { mpPaymentId: String(payment.id), mpStatus: payment.status ?? "pending", emv };
  } catch (error) {
    console.error("Erro ao criar Pix no Mercado Pago, usando Pix estático:", error);
    return null;
  }
}

/**
 * Cria a linha em pix_payments logo após checkout_create_order. Prefere o Pix
 * dinâmico do Mercado Pago (confirmação automática); se indisponível, gera o
 * Pix estático (chave própria + comprovante + confirmação manual do admin).
 */
export async function createPixPaymentForOrder(params: {
  orderId: string;
  orderNumber: string;
  total: number;
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  expiresAt: Date | null;
}) {
  const txid = sanitizeTxid(params.orderNumber);
  const supabase = createAdminClient();

  const mp = await createMercadoPagoPix(params);
  if (mp) {
    await supabase.from("pix_payments").insert({
      order_id: params.orderId,
      txid,
      payload_emv: mp.emv,
      review_status: "aguardando",
      mp_payment_id: mp.mpPaymentId,
      mp_status: mp.mpStatus,
    });
    return mp.emv;
  }

  const pix = await getPixConfig();
  const payload = buildPixPayload({
    pixKey: pix.pixKey,
    merchantName: pix.merchantName,
    merchantCity: pix.merchantCity,
    amount: params.total,
    txid,
  });

  await supabase.from("pix_payments").insert({
    order_id: params.orderId,
    txid,
    payload_emv: payload,
    review_status: "aguardando",
  });

  return payload;
}
