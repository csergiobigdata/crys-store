"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { upsertCouponAction } from "@/lib/admin/coupon-actions";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percentual" | "fixo";
  discount_value: number;
  min_order_value: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
};

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function CouponForm({ coupon }: { coupon: Coupon | null }) {
  const action = upsertCouponAction.bind(null, coupon?.id ?? null);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-plum">Código</label>
          <input
            name="code"
            required
            defaultValue={coupon?.code}
            placeholder="BEMVINDA10"
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-plum">Tipo de desconto</label>
          <select
            name="discountType"
            defaultValue={coupon?.discount_type ?? "percentual"}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          >
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor fixo (R$)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-plum">Valor do desconto</label>
          <input
            name="discountValue"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={coupon?.discount_value}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-plum">
            Pedido mínimo (R$, opcional)
          </label>
          <input
            name="minOrderValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={coupon?.min_order_value ?? ""}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-plum">Válido a partir de</label>
          <input
            name="validFrom"
            type="datetime-local"
            defaultValue={toLocalInputValue(coupon?.valid_from ?? null)}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-plum-soft">Em branco = a partir de agora.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-plum">
            Válido até (opcional)
          </label>
          <input
            name="validUntil"
            type="datetime-local"
            defaultValue={toLocalInputValue(coupon?.valid_until ?? null)}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-plum">
          Limite de uso (opcional)
        </label>
        <input
          name="usageLimit"
          type="number"
          min="1"
          defaultValue={coupon?.usage_limit ?? ""}
          className="mt-1.5 w-full max-w-xs rounded-lg border border-rose/30 px-3 py-2 text-sm"
        />
        {coupon && (
          <p className="mt-1 text-xs text-plum-soft">
            Usado {coupon.usage_count} vez(es) até agora.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-plum">
        <input type="checkbox" name="active" defaultChecked={coupon?.active ?? true} className="h-4 w-4" />
        Cupom ativo
      </label>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar cupom"}
      </Button>
    </form>
  );
}
