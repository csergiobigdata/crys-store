"use server";

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import {
  COUPON_RELEASING_STATUSES,
  computeCouponDiscount,
  MAX_COUPON_CODE_LENGTH,
} from "@/lib/orders/coupon-rules";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";

export type CouponPreview =
  | { ok: true; code: string; discount: number; capped: boolean }
  | { ok: false; message: string };

type PreviewInput = {
  code: string;
  items: { variantId: string; quantity: number }[];
  /** Servem para checar se quem NÃO está logado já usou o cupom (a checagem final é no pedido). */
  cpf?: string;
  email?: string;
};

const notFound: CouponPreview = {
  ok: false,
  message: "Cupom não encontrado. Confira o código digitado.",
};

/**
 * Mostra o desconto de um cupom ANTES de finalizar o pedido. O subtotal é
 * recalculado aqui a partir dos preços do banco (o navegador só informa quais
 * itens estão no carrinho) e as regras são as mesmas do checkout. O pedido
 * sempre revalida tudo no momento de criar.
 */
export async function previewCoupon(input: PreviewInput): Promise<CouponPreview> {
  const code = input.code.trim().toUpperCase();
  if (!code || code.length > MAX_COUPON_CODE_LENGTH || !/^[A-Z0-9_-]+$/.test(code)) {
    return notFound;
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkRateLimit({
    bucket: "coupon_preview",
    identifier: ip,
    maxAttempts: 30,
    windowMinutes: 10,
  });
  if (!allowed) {
    return { ok: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const supabase = createAdminClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, min_order_value, valid_from, valid_until, usage_limit, usage_count, active",
    )
    .eq("code", code)
    .maybeSingle();

  if (!coupon) return notFound;

  const now = Date.now();
  if (!coupon.active || (coupon.valid_until && new Date(coupon.valid_until).getTime() < now)) {
    return { ok: false, message: "Este cupom não está mais vigente." };
  }
  if (new Date(coupon.valid_from).getTime() > now) {
    return { ok: false, message: "Este cupom ainda não está vigente." };
  }
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { ok: false, message: "Este cupom atingiu o limite de usos." };
  }

  // Subtotal pelos preços do banco.
  const items = input.items.filter((item) => item.quantity > 0).slice(0, 50);
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, price_override, product:products(base_price)")
    .in(
      "id",
      items.map((item) => item.variantId),
    );

  const priceById = new Map(
    (variants ?? []).map((variant) => {
      const product = variant.product as unknown as { base_price: number } | null;
      return [variant.id, Number(variant.price_override ?? product?.base_price ?? 0)];
    }),
  );
  const subtotal = items.reduce(
    (sum, item) => sum + (priceById.get(item.variantId) ?? 0) * Math.min(item.quantity, 99),
    0,
  );
  if (subtotal <= 0) return { ok: false, message: "Seu carrinho está vazio." };

  if (coupon.min_order_value !== null && subtotal < Number(coupon.min_order_value)) {
    return {
      ok: false,
      message: `Este cupom vale para pedidos a partir de ${formatCurrency(Number(coupon.min_order_value))}.`,
    };
  }

  // O cliente só pode usar o mesmo cupom uma vez (pedidos cancelados/expirados não contam).
  const user = await getCurrentUser();
  const releasing = `(${COUPON_RELEASING_STATUSES.join(",")})`;
  const countUses = async (column: string, value: string, ilike = false) => {
    let query = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .not("status", "in", releasing);
    query = ilike ? query.ilike(column, value) : query.eq(column, value);
    const { count } = await query;
    return count ?? 0;
  };

  const cpf = (input.cpf ?? "").replace(/\D/g, "");
  const email = (input.email ?? "").trim();
  const previousUses =
    (user ? await countUses("profile_id", user.id) : 0) +
    (cpf.length === 11 ? await countUses("guest_cpf", cpf) : 0) +
    (email ? await countUses("guest_email", email.replace(/[\\%_]/g, "\\$&"), true) : 0);
  if (previousUses > 0) {
    return { ok: false, message: "Você já utilizou este cupom." };
  }

  const { discount, capped } = computeCouponDiscount({
    type: coupon.discount_type as "percentual" | "fixo",
    value: Number(coupon.discount_value),
    subtotal,
  });
  return { ok: true, code: coupon.code, discount, capped };
}
