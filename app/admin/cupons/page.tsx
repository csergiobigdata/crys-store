import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Cupons — Admin" };

export default async function AdminCouponsPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("id, name, code, discount_type, discount_value, usage_count, usage_limit, active")
    .order("code");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-plum">Cupons</h1>
        <ButtonLink href="/admin/cupons/novo">Novo cupom</ButtonLink>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-rose-light bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rose-light text-plum-soft">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Código</th>
              <th className="p-4">Desconto</th>
              <th className="p-4">Uso</th>
              <th className="p-4">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-light">
            {(coupons ?? []).map((coupon) => (
              <tr key={coupon.id}>
                <td className="p-4 text-plum">{coupon.name ?? "—"}</td>
                <td className="p-4 font-medium text-plum">{coupon.code}</td>
                <td className="p-4 text-plum-soft">
                  {coupon.discount_type === "percentual"
                    ? `${coupon.discount_value}%`
                    : formatCurrency(Number(coupon.discount_value))}
                </td>
                <td className="p-4 text-plum-soft">
                  {coupon.usage_count}
                  {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                </td>
                <td className="p-4">
                  <span
                    className={
                      coupon.active
                        ? "rounded-full bg-success-light px-3 py-1 text-xs font-medium text-success"
                        : "rounded-full bg-rose-light/60 px-3 py-1 text-xs font-medium text-plum-soft"
                    }
                  >
                    {coupon.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/admin/cupons/${coupon.id}`}
                    className="text-sm font-medium text-rose-dark hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(coupons ?? []).length === 0 && (
          <p className="p-6 text-center text-plum-soft">Nenhum cupom cadastrado.</p>
        )}
      </div>
    </div>
  );
}
