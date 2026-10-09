import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Auditoria — Admin" };

const actionLabels: Record<string, string> = {
  create_product: "Criou produto",
  update_product: "Editou produto",
  create_category: "Criou categoria",
  update_category: "Editou categoria",
  create_coupon: "Criou cupom",
  update_coupon: "Editou cupom",
  confirm_pix_payment: "Confirmou pagamento Pix",
  reject_pix_payment: "Recusou comprovante Pix",
  refund_card_payment: "Estornou pagamento no cartão",
  cancel_order: "Cancelou pedido",
  mark_order_shipped: "Marcou pedido como enviado",
  update_general_settings: "Atualizou configurações gerais",
  update_local_delivery: "Atualizou a entrega local (frete)",
  create_shipping_rule: "Criou regra de frete",
  update_shipping_rule: "Editou regra de frete",
};

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("id, entity_type, entity_id, action, changes, created_at, actor:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (tipo) query = query.eq("entity_type", tipo);

  const { data } = await query;
  const logs = data as unknown as {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    changes: unknown;
    created_at: string;
    actor: { full_name: string | null } | null;
  }[];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-plum">
        Log de auditoria
      </h1>

      <form method="get" className="mt-6 flex gap-3">
        <select
          name="tipo"
          defaultValue={tipo ?? ""}
          className="rounded-lg border border-rose/30 px-3 py-2 text-sm"
        >
          <option value="">Todos os tipos</option>
          <option value="order">Pedidos</option>
          <option value="product">Produtos</option>
          <option value="category">Categorias</option>
          <option value="coupon">Cupons</option>
          <option value="shipping_config">Frete</option>
          <option value="app_settings">Configurações</option>
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
              <th className="p-4">Quando</th>
              <th className="p-4">Quem</th>
              <th className="p-4">Ação</th>
              <th className="p-4">Entidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-light">
            {(logs ?? []).map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap p-4 text-plum-soft">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="p-4 text-plum-soft">
                  {log.actor?.full_name ?? "Sistema"}
                </td>
                <td className="p-4 text-plum">
                  {actionLabels[log.action] ?? log.action}
                </td>
                <td className="p-4 text-xs text-plum-soft">
                  {log.entity_type} · {log.entity_id.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(logs ?? []).length === 0 && (
          <p className="p-6 text-center text-plum-soft">
            Nenhum registro de auditoria ainda.
          </p>
        )}
      </div>
    </div>
  );
}
