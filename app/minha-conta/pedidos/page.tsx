import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { orderStatusLabels } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?redirect=/minha-conta/pedidos");

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, access_token, status, total, payment_method, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Meus pedidos
      </h1>

      {!orders || orders.length === 0 ? (
        <p className="mt-6 text-plum-soft">Você ainda não fez nenhum pedido.</p>
      ) : (
        <ul className="mt-8 divide-y divide-rose-light rounded-2xl border border-rose-light bg-surface shadow-card">
          {orders.map((order) => (
            <li key={order.order_number} className="flex items-center justify-between p-5">
              <div>
                <Link
                  href={`/pedidos/${order.order_number}?token=${order.access_token}`}
                  className="font-medium text-plum hover:text-rose-dark"
                >
                  {order.order_number}
                </Link>
                <p className="text-sm text-plum-soft">
                  {orderStatusLabels[order.status] ?? order.status} ·{" "}
                  {formatDate(order.created_at)}
                </p>
              </div>
              <p className="font-medium text-plum">{formatCurrency(Number(order.total))}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
