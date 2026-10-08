import type { Metadata } from "next";
import Link from "next/link";
import { orderStatusLabels } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Pedidos — Admin" };

const statusOptions = Object.entries(orderStatusLabels);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; metodo?: string }>;
}) {
  const { status, metodo } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, created_at, guest_name, guest_email, payment_method, status, total")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (metodo) query = query.eq("payment_method", metodo);

  const { data: orders } = await query;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-plum">
        Pedidos
      </h1>

      <form method="get" className="mt-6 flex flex-wrap gap-4">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-rose/30 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-rose-light bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rose-light text-plum-soft">
            <tr>
              <th className="p-4">Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Pagamento</th>
              <th className="p-4">Status</th>
              <th className="p-4">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-light">
            {(orders ?? []).map((order) => (
              <tr key={order.id}>
                <td className="p-4">
                  <Link
                    href={`/admin/pedidos/${order.order_number}`}
                    className="font-medium text-plum hover:text-rose-dark"
                  >
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-plum-soft">
                    {new Date(order.created_at).toLocaleString("pt-BR")}
                  </p>
                </td>
                <td className="p-4 text-plum-soft">
                  {order.guest_name ?? order.guest_email}
                </td>
                <td className="p-4 text-plum-soft">
                  {order.payment_method === "pix" ? "Pix" : "Cartão"}
                </td>
                <td className="p-4 text-plum-soft">
                  {orderStatusLabels[order.status] ?? order.status}
                </td>
                <td className="p-4 font-medium text-plum">
                  {formatCurrency(Number(order.total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(orders ?? []).length === 0 && (
          <p className="p-6 text-center text-plum-soft">
            Nenhum pedido encontrado para esse filtro.
          </p>
        )}
      </div>
    </div>
  );
}
