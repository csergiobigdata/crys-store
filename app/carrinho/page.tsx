import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Carrinho" };

export default async function CartPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Carrinho
      </h1>
      <div className="mt-8">
        <CartView isAdmin={user?.role === "admin"} />
      </div>
    </div>
  );
}
