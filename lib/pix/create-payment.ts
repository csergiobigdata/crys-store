import "server-only";
import { getPixConfig } from "@/lib/pix/config";
import { buildPixPayload } from "@/lib/pix/payload";
import { sanitizeTxid } from "@/lib/pix/text";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cria a linha em pix_payments com o payload BR Code já gerado — chamado
 * logo após checkout_create_order, quando payment_method = 'pix'.
 */
export async function createPixPaymentForOrder(params: {
  orderId: string;
  orderNumber: string;
  total: number;
}) {
  const txid = sanitizeTxid(params.orderNumber);
  const pix = await getPixConfig();

  const payload = buildPixPayload({
    pixKey: pix.pixKey,
    merchantName: pix.merchantName,
    merchantCity: pix.merchantCity,
    amount: params.total,
    txid,
  });

  const supabase = createAdminClient();
  await supabase.from("pix_payments").insert({
    order_id: params.orderId,
    txid,
    payload_emv: payload,
    review_status: "aguardando",
  });

  return payload;
}
