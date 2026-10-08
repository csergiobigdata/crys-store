import { getCurrentUser } from "@/lib/auth/session";
import { getPixExpirationHours } from "@/lib/pix/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrderWithDetails = {
  id: string;
  order_number: string;
  access_token: string;
  profile_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_cpf: string | null;
  shipping_address: Record<string, string>;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  payment_method: "pix" | "cartao";
  status: string;
  pix_expires_at: string | null;
  items: {
    id: string;
    product_name_snapshot: string;
    variant_attributes_snapshot: Record<string, string>;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[];
  pix_payment: {
    payload_emv: string;
    review_status: "aguardando" | "em_analise" | "confirmado" | "recusado";
    proof_file_path: string | null;
    /** Preenchido quando o Pix foi criado no Mercado Pago (confirmação automática). */
    mp_payment_id: string | null;
  } | null;
};

/**
 * Busca um pedido para exibição na página do cliente. Usa a service role
 * (fora do RLS) porque o convidado acessa pelo access_token da URL, não
 * por auth.uid() — ver docs/arquitetura.md, seção 5.
 */
export async function getOrderForViewing(
  orderNumber: string,
  token?: string,
): Promise<OrderWithDetails | null> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*), pix_payment:pix_payments(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) return null;

  const user = await getCurrentUser();
  const isOwner = Boolean(user && order.profile_id === user.id);
  const hasValidToken = Boolean(token && token === order.access_token);

  if (!isOwner && !hasValidToken) return null;

  if (
    order.payment_method === "pix" &&
    ["aguardando_pagamento", "em_analise"].includes(order.status) &&
    order.pix_expires_at &&
    new Date(order.pix_expires_at) < new Date()
  ) {
    await supabase.rpc("expire_pix_order", { p_order_id: order.id });
    return getOrderForViewing(orderNumber, token);
  }

  if (
    order.payment_method === "cartao" &&
    ["aguardando_pagamento", "pagamento_recusado"].includes(order.status)
  ) {
    const maxAgeHours = await getPixExpirationHours();
    const ageHours = (Date.now() - new Date(order.created_at).getTime()) / 36e5;
    if (ageHours > maxAgeHours) {
      await supabase.rpc("expire_stale_card_order", {
        p_order_id: order.id,
        p_max_age_hours: maxAgeHours,
      });
      return getOrderForViewing(orderNumber, token);
    }
  }

  return order as unknown as OrderWithDetails;
}
