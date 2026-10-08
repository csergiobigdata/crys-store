import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Relatórios — Admin" };

const PAID_STATUSES = ["pago", "em_separacao", "enviado", "entregue"];

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const defaults = defaultDateRange();
  const from = params.from || defaults.from;
  const to = params.to || defaults.to;

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("payment_method, total, status, created_at")
    .in("status", PAID_STATUSES)
    .gte("created_at", `${from}T00:00:00.000Z`)
    .lte("created_at", `${to}T23:59:59.999Z`);

  const rows = orders ?? [];
  const totalRevenue = rows.reduce((sum, o) => sum + Number(o.total), 0);
  const byMethod = {
    pix: rows.filter((o) => o.payment_method === "pix"),
    cartao: rows.filter((o) => o.payment_method === "cartao"),
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Relatórios
      </h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-plum-soft">De</label>
          <input
            name="from"
            type="date"
            defaultValue={from}
            className="mt-1 rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-plum-soft">Até</label>
          <input
            name="to"
            type="date"
            defaultValue={to}
            className="mt-1 rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-rose/30 px-4 py-2 text-sm font-medium text-plum hover:border-rose"
        >
          Aplicar
        </button>
      </form>

      <p className="mt-2 text-xs text-plum-soft">
        Considera pedidos pagos, em separação, enviados ou entregues no período.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
          <p className="text-sm text-plum-soft">Faturamento total</p>
          <p className="mt-2 font-display text-2xl text-plum">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-plum-soft">{rows.length} pedido(s)</p>
        </div>
        <div className="rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
          <p className="text-sm text-plum-soft">Via Pix</p>
          <p className="mt-2 font-display text-2xl text-plum">
            {formatCurrency(byMethod.pix.reduce((s, o) => s + Number(o.total), 0))}
          </p>
          <p className="mt-1 text-xs text-plum-soft">{byMethod.pix.length} pedido(s)</p>
        </div>
        <div className="rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
          <p className="text-sm text-plum-soft">Via cartão</p>
          <p className="mt-2 font-display text-2xl text-plum">
            {formatCurrency(byMethod.cartao.reduce((s, o) => s + Number(o.total), 0))}
          </p>
          <p className="mt-1 text-xs text-plum-soft">{byMethod.cartao.length} pedido(s)</p>
        </div>
      </div>
    </div>
  );
}
