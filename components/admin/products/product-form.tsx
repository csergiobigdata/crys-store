"use client";

import { useActionState } from "react";
import { upsertProductAction } from "@/lib/admin/product-actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

type Category = { id: string; name: string };

export function ProductForm({
  productId,
  categories,
  initial,
}: {
  productId: string | null;
  categories: Category[];
  initial?: {
    name: string;
    slug: string;
    description: string | null;
    base_price: number;
    category_id: string | null;
    status: "A" | "I";
    inactivated_at: string | null;
    is_test: boolean;
    is_customized: boolean;
  };
}) {
  const action = upsertProductAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-plum">Nome</label>
          <input
            name="name"
            required
            defaultValue={initial?.name}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-plum">Slug</label>
          <input
            name="slug"
            required
            defaultValue={initial?.slug}
            placeholder="bolsa-tote-essence"
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-plum">Descrição</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={initial?.description ?? ""}
          className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-plum">
            Preço base (R$)
          </label>
          <input
            name="basePrice"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            required
            defaultValue={initial?.base_price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-plum">Categoria</label>
          <select
            name="categoryId"
            required
            defaultValue={initial?.category_id ?? ""}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-rose/30 bg-surface px-3 py-3 text-sm">
        <input
          type="checkbox"
          name="isTest"
          defaultChecked={initial?.is_test ?? false}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="font-medium text-plum">Produto de teste</span>
          <span className="mt-0.5 block text-xs text-plum-soft">
            Produtos de teste ficam ocultos no catálogo e não podem ser comprados por clientes.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-rose/30 bg-surface px-3 py-3 text-sm">
        <input
          type="checkbox"
          name="isCustomized"
          defaultChecked={initial?.is_customized ?? false}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="font-medium text-plum">Produto customizado</span>
          <span className="mt-0.5 block text-xs text-plum-soft">
            Uma unidade tem prazo de preparação de até 5 dias; para 2 ou mais, a data deve ser
            combinada com a loja.
          </span>
        </span>
      </label>

      {initial ? (
        <div>
          <label className="block text-sm font-medium text-plum">Status</label>
          <select
            name="status"
            defaultValue={initial.status}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm sm:w-72"
          >
            <option value="A">A — Ativo (disponível para compra)</option>
            <option value="I">I — Inativo (oculto da loja)</option>
          </select>
          {initial.status === "I" && initial.inactivated_at && (
            <p className="mt-1 text-xs text-plum-soft">
              Inativado em{" "}
              {formatDate(initial.inactivated_at)}.
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-sky-light px-3 py-2 text-sm text-sky-dark">
          Todo produto novo é criado com status <strong>A (Ativo)</strong>.
        </p>
      )}

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar produto"}
      </Button>
    </form>
  );
}
