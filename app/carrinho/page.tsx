import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Carrinho" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Carrinho
      </h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
