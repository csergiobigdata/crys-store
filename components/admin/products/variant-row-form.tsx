"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteVariantAction, upsertVariantAction } from "@/lib/admin/product-actions";
import { VariantAttributeFields } from "@/components/admin/products/variant-attribute-fields";

type Variant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price_override: number | null;
  stock_quantity: number;
  active: boolean;
};

export function VariantRowForm({
  productId,
  variant,
}: {
  productId: string;
  variant: Variant | null;
}) {
  const action = upsertVariantAction.bind(null, productId, variant?.id ?? null);
  const [state, formAction, pending] = useActionState(action, undefined);

  const attributeEntries = Object.entries(variant?.attributes ?? {});

  return (
    <form
      action={formAction}
      className="grid gap-2 rounded-lg border border-rose-light bg-surface p-3 sm:grid-cols-12 sm:items-end sm:gap-2"
    >
      <div className="sm:col-span-2">
        <label className="block text-xs text-plum-soft">SKU</label>
        <input
          name="sku"
          required
          defaultValue={variant?.sku}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <VariantAttributeFields
        index={1}
        idPrefix={variant?.id ?? productId}
        defaultKey={attributeEntries[0]?.[0] ?? ""}
        defaultValue={attributeEntries[0]?.[1] ?? ""}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <label className="block text-xs text-plum-soft">Preço (opc.)</label>
        <input
          name="priceOverride"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={variant?.price_override?.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) ?? ""}
          className="mt-1 w-full min-w-32 rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-plum-soft">Estoque</label>
        <input
          name="stockQuantity"
          type="number"
          min="0"
          required
          defaultValue={variant?.stock_quantity ?? 1}
          className="mt-1 w-full min-w-32 rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <details className="sm:col-span-full" open={Boolean(attributeEntries[1])}>
        <summary className="cursor-pointer text-xs text-plum-soft">
          Atributo adicional (opcional)
        </summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <VariantAttributeFields
            index={2}
            idPrefix={variant?.id ?? productId}
            defaultKey={attributeEntries[1]?.[0] ?? ""}
            defaultValue={attributeEntries[1]?.[1] ?? ""}
          />
        </div>
      </details>
      <div className="flex items-center gap-1 sm:col-span-1">
        <input
          type="checkbox"
          name="active"
          defaultChecked={variant?.active ?? true}
          className="h-4 w-4"
        />
        <span className="text-xs text-plum-soft">Ativa</span>
      </div>
      <div className="flex gap-2 sm:col-span-1">
        <Button type="submit" size="sm" disabled={pending}>
          {variant ? "Salvar" : "Adicionar"}
        </Button>
        {variant && (
          <button
            type="button"
            onClick={async () => {
              await deleteVariantAction(productId, variant.id);
            }}
            className="text-xs text-error hover:underline"
          >
            Remover
          </button>
        )}
      </div>

      {state?.error && (
        <p className="col-span-full rounded-lg bg-error-light px-3 py-2 text-xs text-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
