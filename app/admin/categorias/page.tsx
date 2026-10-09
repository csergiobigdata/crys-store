import type { Metadata } from "next";
import { CategoryRowForm } from "@/components/admin/categories/category-row-form";
import { MAX_CATEGORIES } from "@/lib/admin/category-limit";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Categorias — Admin" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, active")
    .order("name");

  const total = categories?.length ?? 0;
  const limitReached = total >= MAX_CATEGORIES;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Categorias
      </h1>

      <p className="mt-2 text-sm text-plum-soft">
        {total} de {MAX_CATEGORIES} categorias criadas.
      </p>

      <div className="mt-6 space-y-3">
        {(categories ?? []).map((category) => (
          <CategoryRowForm key={category.id} category={category} />
        ))}

        {limitReached ? (
          <p className="rounded-lg bg-rose-light/50 px-4 py-3 text-sm text-plum">
            Você chegou ao limite de {MAX_CATEGORIES} categorias. Para criar outra, exclua ou
            reaproveite uma existente.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-plum">Nova categoria</p>
            <CategoryRowForm category={null} />
          </div>
        )}
      </div>
    </div>
  );
}
