import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeliveryForm } from "@/components/account/delivery-form";
import { DeleteAccountForm } from "@/components/auth/delete-account-form";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { getCheckoutPrefill } from "@/lib/auth/checkout-prefill";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Minha conta" };

export default async function MyAccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/entrar?redirect=/minha-conta");
  }

  const prefill = await getCheckoutPrefill(user);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Minha conta
      </h1>
      <p className="mt-2 text-plum-soft">
        Olá, {user.fullName ?? user.email}.
      </p>

      <div className="mt-8 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <p className="text-sm text-plum-soft">E-mail</p>
        <p className="font-medium text-plum">{user.email}</p>
      </div>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-xl text-plum">Dados de entrega</h2>
        <p className="mt-1 text-sm text-plum-soft">
          Esses dados são sugeridos automaticamente no checkout. Você pode
          alterá-los quando quiser.
        </p>
        <DeliveryForm prefill={prefill} />
      </section>

      <Link
        href="/minha-conta/pedidos"
        className="mt-6 inline-block text-sm font-medium text-rose-dark hover:underline"
      >
        Ver meus pedidos →
      </Link>

      <form action={logout} className="mt-8">
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>

      <div className="mt-12 rounded-2xl border border-error/30 bg-error-light/40 p-6">
        <h2 className="font-display text-lg text-plum">Excluir minha conta</h2>
        <p className="mt-2 text-sm text-plum-soft">
          Remove sua conta e dados de perfil permanentemente (LGPD, direito
          à exclusão). Pedidos já feitos continuam no histórico da loja,
          sem ficar associados à sua conta. Essa ação não pode ser desfeita.
        </p>
        <DeleteAccountForm />
      </div>
    </div>
  );
}
