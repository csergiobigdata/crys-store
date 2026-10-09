/** Regras de cupom de desconto da loja. */

/** O desconto nunca passa deste percentual do valor total dos produtos (sem o frete). */
export const MAX_DISCOUNT_PERCENT = 30;

/** O nome (apelido) do cupom, usado só para o admin identificá-lo, tem até este tamanho. */
export const MAX_COUPON_NAME_LENGTH = 10;

/** O cliente digita o código do cupom no checkout com até este tamanho. */
export const MAX_COUPON_CODE_LENGTH = 15;

/** Pedidos nestes status não "gastam" o cupom: ele volta a poder ser usado pelo cliente. */
export const COUPON_RELEASING_STATUSES = ["cancelado", "expirado", "estornado"] as const;

/**
 * Desconto de um cupom sobre o valor total dos produtos (sem frete), já com o
 * teto de MAX_DISCOUNT_PERCENT. É a mesma regra aplicada pelo banco em
 * checkout_create_order — aqui serve para mostrar o desconto antes de finalizar.
 */
export function computeCouponDiscount(params: {
  type: "percentual" | "fixo";
  value: number;
  subtotal: number;
}): { discount: number; capped: boolean } {
  const raw =
    params.type === "percentual"
      ? Math.round(params.subtotal * params.value) / 100
      : params.value;
  const cap = Math.round(params.subtotal * MAX_DISCOUNT_PERCENT) / 100;
  const discount = Math.max(0, Math.min(raw, params.subtotal, cap));
  return { discount: Math.round(discount * 100) / 100, capped: raw > discount };
}
