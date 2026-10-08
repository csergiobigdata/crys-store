"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { deleteCategoryAction, upsertCategoryAction } from "@/lib/admin/category-actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
};

export function CategoryRowForm({ category }: { category: Category | null }) {
  const action = upsertCategoryAction.bind(null, category?.id ?? null);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="grid gap-2 rounded-lg border border-rose-light bg-surface p-3 sm:grid-cols-12 sm:items-end"
    >
      <div className="sm:col-span-3">
        <label className="block text-xs text-plum-soft">Nome</label>
        <input
          name="name"
          required
          defaultValue={category?.name}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-plum-soft">Slug</label>
        <input
          name="slug"
          required
          defaultValue={category?.slug}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-4">
        <label className="block text-xs text-plum-soft">Descrição</label>
        <input
          name="description"
          defaultValue={category?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-rose/30 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-1.5 sm:col-span-1">
        <input
          type="checkbox"
          name="active"
          defaultChecked={category?.active ?? true}
          className="h-4 w-4"
        />
        <span className="text-xs text-plum-soft">Ativa</span>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {category ? "Salvar" : "Adicionar"}
        </Button>
        {category && (
          <ConfirmActionButton
            label="Excluir"
            title={`Excluir a categoria "${category.name}"?`}
            description="A categoria será removida definitivamente. Se ainda houver produtos nela, a exclusão será bloqueada."
            action={deleteCategoryAction.bind(null, category.id)}
          />
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
