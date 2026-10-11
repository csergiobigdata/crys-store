import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { orderStatusLabels, orderStatusTone } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Meus pedidos" };

// Pedidos que já chegaram a um desfecho; os demais ainda estão em andamento.
const FINISHED_STATUSES = ["entregue", "cancelado", "expirado", "pagamento_recusado", "estornado"];

const toneClasses: Record<string, string> = {
  neutral: "bg-rose-light/60 text-plum",
  warning: "bg-rose-light/50 text-rose-dark",
  success: "bg-success-light text-success",
  error: "bg-error-light text-error",
};

type OrderRow = {
  order_number: string;
  access_token: string;
  status: string;
  total: number;
  created_at: string;
  items: {
    id: string;
    product_name_snapshot: string;
    variant_attributes_snapshot: Record<string, string> | null;
    quantity: number;
    variant: { product: { slug: string; active: boolean } | null } | null;
  }[];
};

function OrderList({ orders }: { orders: OrderRow[] }) {
  return (
    <ul className="space-y-4">
      {orders.map((order) => {
        const tone = orderStatusTone[order.status] ?? "neutral";
        return (
          <li
            key={order.order_number}
            className="rounded-2xl border border-rose-light bg-surface p-5 shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/pedidos/${order.order_number}?token=${order.access_token}`}
                  className="font-medium text-plum hover:text-rose-dark"
                >
                  Pedido {order.order_number}
                </Link>
                <p className="text-sm text-plum-soft">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-1 text-xs font-medium",
                    toneClasses[tone],
                  )}
                >
                  {orderStatusLabels[order.status] ?? order.status}
                </span>
                <p className="mt-1 font-medium text-plum">{formatCurrency(Number(order.total))}</p>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-rose-light pt-4 text-sm">
              {order.items.map((item) => {
                const slug = item.variant?.product?.active ? item.variant.product.slug : null;
                const attributes = Object.values(item.variant_attributes_snapshot ?? {}).join(" · ");
                return (
                  <li key={item.id} className="flex justify-between gap-3 text-plum-soft">
                    <span>
                      {slug ? (
                        <Link href={`/produto/${slug}`} className="text-plum hover:text-rose-dark">
                          {item.product_name_snapshot}
                        </Link>
                      ) : (
                        <span className="text-plum">{item.product_name_snapshot}</span>
                      )}
                      {attributes && ` (${attributes})`}
                    </span>
                    <span className="shrink-0">{item.quantity}x</span>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?redirect=/minha-conta/pedidos");

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "order_number, access_token, status, total, created_at, items:order_items(id, product_name_snapshot, variant_attributes_snapshot, quantity, variant:product_variants(product:products(slug, active)))",
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as OrderRow[];
  const current = orders.filter((o) => !FINISHED_STATUSES.includes(o.status));
  const previous = orders.filter((o) => FINISHED_STATUSES.includes(o.status));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">Meus pedidos</h1>
      <p className="mt-2 text-sm text-plum-soft">
        Acompanhe os produtos dos seus pedidos em andamento e o histórico das compras anteriores.
      </p>

      {orders.length === 0 ? (
        <p className="mt-6 text-plum-soft">Você ainda não fez nenhum pedido.</p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="font-display text-xl text-plum">Pedidos em andamento</h2>
            <div className="mt-4">
              {current.length === 0 ? (
                <p className="text-sm text-plum-soft">Nenhum pedido em andamento.</p>
              ) : (
                <OrderList orders={current} />
              )}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl text-plum">Compras anteriores</h2>
            <div className="mt-4">
              {previous.length === 0 ? (
                <p className="text-sm text-plum-soft">Nenhuma compra anterior.</p>
              ) : (
                <OrderList orders={previous} />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
