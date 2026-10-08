"use client";

import { useActionState } from "react";
import { upsertProductAction } from "@/lib/admin/product-actions";
import { Button } from "@/components/ui/button";

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
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={initial?.base_price}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-plum">Categoria</label>
          <select
            name="categoryId"
            defaultValue={initial?.category_id ?? ""}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
              {new Date(initial.inactivated_at).toLocaleDateString("pt-BR")}.
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
