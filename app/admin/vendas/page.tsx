import type { Metadata } from "next";
import Link from "next/link";
import { orderStatusLabels, PAID_STATUSES } from "@/lib/orders/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Vendas — Admin" };

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; metodo?: string }>;
}) {
  const { from, to, metodo } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, created_at, guest_name, guest_email, payment_method, status, total, items:order_items(product_name_snapshot, quantity)",
    )
    .in("status", PAID_STATUSES)
    .order("created_at", { ascending: false })
    .limit(200);

  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
  if (metodo) query = query.eq("payment_method", metodo);

  const { data } = await query;
  const orders = data ?? [];

  // Quando e por quem o pagamento foi confirmado (sem autor = confirmação automática).
  const confirmations = new Map<string, { at: string; by: string | null }>();
  if (orders.length > 0) {
    const admin = createAdminClient();
    const { data: history } = await admin
      .from("order_status_history")
      .select("order_id, created_at, changed_by")
      .eq("to_status", "pago")
      .in("order_id", orders.map((o) => o.id))
      .order("created_at", { ascending: true });

    const authorIds = [
      ...new Set((history ?? []).map((h) => h.changed_by).filter(Boolean)),
    ] as string[];
    const names = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, nickname")
        .in("id", authorIds);
      for (const p of profiles ?? []) {
        names.set(p.id, p.full_name ?? p.nickname ?? "Administrador");
      }
    }
    for (const h of history ?? []) {
      confirmations.set(h.order_id, {
        at: h.created_at,
        by: h.changed_by ? (names.get(h.changed_by) ?? "Administrador") : null,
      });
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-plum">Vendas</h1>
      <p className="mt-2 text-sm text-plum-soft">
        Somente pedidos com o pagamento confirmado. Para confirmar um pagamento, use o botão
        &quot;Confirmar pagamento&quot; em{" "}
        <Link href="/admin/pedidos" className="font-medium text-rose-dark hover:underline">
          Pedidos
        </Link>
        .
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <label className="text-xs text-plum-soft">
          De
          <input
            name="from"
            type="date"
            defaultValue={from ?? ""}
            className="mt-1 block rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-plum-soft">
          Até
          <input
            name="to"
            type="date"
            defaultValue={to ?? ""}
            className="mt-1 block rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </label>
        <select
          name="metodo"
          defaultValue={metodo ?? ""}
          className="rounded-lg border border-rose/30 px-3 py-2 text-sm"
        >
          <option value="">Pix e cartão</option>
          <option value="pix">Pix</option>
          <option value="cartao">Cartão</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-rose/30 px-4 py-2 text-sm font-medium text-plum hover:border-rose"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-light bg-surface p-5 shadow-card">
          <p className="text-sm text-plum-soft">Vendas confirmadas</p>
          <p className="mt-1 font-display text-2xl font-semibold text-plum">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-rose-light bg-surface p-5 shadow-card">
          <p className="text-sm text-plum-soft">Valor total</p>
          <p className="mt-1 font-display text-2xl font-semibold text-rose-dark">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-rose-light bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rose-light text-plum-soft">
            <tr>
              <th className="p-4">Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Produtos</th>
              <th className="p-4">Pagamento</th>
              <th className="p-4">Confirmado</th>
              <th className="p-4">Situação</th>
              <th className="p-4">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-light">
            {orders.map((order) => {
              const confirmation = confirmations.get(order.id);
              return (
                <tr key={order.id}>
                  <td className="p-4">
                    <Link
                      href={`/admin/pedidos/${order.order_number}`}
                      className="font-medium text-plum hover:text-rose-dark"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-plum-soft">{formatDateTime(order.created_at)}</p>
                  </td>
                  <td className="p-4 text-plum-soft">{order.guest_name ?? order.guest_email}</td>
                  <td className="p-4 text-plum-soft">
                    {(order.items ?? []).map((item, i) => (
                      <p key={i}>
                        {item.quantity}x {item.product_name_snapshot}
                      </p>
                    ))}
                  </td>
                  <td className="p-4 text-plum-soft">
                    {order.payment_method === "pix" ? "Pix" : "Cartão"}
                  </td>
                  <td className="p-4 text-plum-soft">
                    {confirmation ? (
                      <>
                        {formatDateTime(confirmation.at)}
                        <p className="text-xs">por {confirmation.by ?? "confirmação automática"}</p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4 text-plum-soft">
                    {orderStatusLabels[order.status] ?? order.status}
                  </td>
                  <td className="p-4 font-medium text-plum">
                    {formatCurrency(Number(order.total))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <p className="p-6 text-center text-plum-soft">
            Nenhuma venda com pagamento confirmado para esse filtro.
          </p>
        )}
      </div>
    </div>
  );
}
