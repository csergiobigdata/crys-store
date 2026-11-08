/** Máximo de unidades de uma mesma variação no carrinho (e no pedido). */
export const MAX_QUANTITY_PER_ITEM = 99;

export type CartLine = {
  variantId: string;
  quantity: number;
};

export type CartLineDetails = CartLine & {
  productId: string;
  productName: string;
  productSlug: string;
  isCustomized: boolean;
  variantAttributes: Record<string, string>;
  unitPrice: number;
  imageUrl: string | null;
  imageAlt: string;
  stockQuantity: number;
  active: boolean;
};
