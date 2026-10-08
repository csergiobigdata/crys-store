"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteVariantAction, upsertVariantAction } from "@/lib/admin/product-actions";

type ProductImage = { id: string; url: string; alt_text: string };

type Variant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price_override: number | null;
  stock_quantity: number;
  active: boolean;
  image_id: string | null;
};

export function VariantRowForm({
  productId,
  variant,
  images,
}: {
  productId: string;
  variant: Variant | null;
  images: ProductImage[];
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
      <div className="sm:col-span-2">
        <label className="block text-xs text-plum-soft">Atributo 1</label>
        <input
          name="attributeKey1"
          placeholder="cor"
          defaultValue={attributeEntries[0]?.[0] ?? ""}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-plum-soft">Valor 1</label>
        <input
          name="attributeValue1"
          placeholder="Dourado"
          defaultValue={attributeEntries[0]?.[1] ?? ""}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-plum-soft">Preço (opc.)</label>
        <input
          name="priceOverride"
          type="number"
          step="0.01"
          min="0"
          defaultValue={variant?.price_override ?? ""}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs text-plum-soft">Estoque</label>
        <input
          name="stockQuantity"
          type="number"
          min="0"
          required
          defaultValue={variant?.stock_quantity ?? 0}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-plum-soft">Foto</label>
        <select
          name="imageId"
          defaultValue={variant?.image_id ?? ""}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        >
          <option value="">Sem foto específica</option>
          {images.map((image) => (
            <option key={image.id} value={image.id}>
              {image.alt_text}
            </option>
          ))}
        </select>
      </div>
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
