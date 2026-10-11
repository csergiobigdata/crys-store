import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCheckoutPrefill } from "@/lib/auth/checkout-prefill";
import { getCurrentUser } from "@/lib/auth/session";
import { SalesPausedNotice } from "@/components/site/sales-paused-notice";
import { isCardPaymentEnabled } from "@/lib/mercadopago/card-enabled";
import { getPrimaryAdminContact } from "@/lib/site/contact";
import { areSalesPaused } from "@/lib/site/sales-status";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  if (await areSalesPaused()) {
    const primaryAdmin = await getPrimaryAdminContact();
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-plum">Checkout</h1>
        <SalesPausedNotice phone={primaryAdmin?.phone ?? null} className="mt-6 rounded-2xl" />
        <Link href="/catalogo" className="mt-6 inline-block font-medium text-rose-dark hover:underline">
          Continuar navegando pelos produtos
        </Link>
      </div>
    );
  }

  const user = await getCurrentUser();
  const prefill = user ? await getCheckoutPrefill(user) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Checkout
      </h1>
      <p className="mt-2 text-plum-soft">
        {user ? (
          "Finalize seu pedido abaixo. Sugerimos seus dados salvos — confira antes de confirmar."
        ) : (
          <>
            Você pode comprar como convidado (precisamos do seu CPF e do
            endereço de entrega) ou{" "}
            <Link
              href="/entrar?redirect=/checkout"
              className="font-medium text-rose-dark hover:underline"
            >
              entrar na sua conta
            </Link>{" "}
            para ter seus dados preenchidos automaticamente.
          </>
        )}
      </p>

      <div className="mt-8">
        <CheckoutForm
          prefill={prefill}
          isLoggedIn={Boolean(user)}
          cardEnabled={isCardPaymentEnabled()}
        />
      </div>
    </div>
  );
}
