"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

/** Esvazia o carrinho assim que a página de confirmação do pedido monta. */
export function ClearCartOnMount() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
