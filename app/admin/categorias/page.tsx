import type { Metadata } from "next";
import { CategoryRowForm } from "@/components/admin/categories/category-row-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Categorias — Admin" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, active")
    .order("name");

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Categorias
      </h1>

      <div className="mt-6 space-y-3">
        {(categories ?? []).map((category) => (
          <CategoryRowForm key={category.id} category={category} />
        ))}

        <div>
          <p className="mb-2 text-sm font-medium text-plum">Nova categoria</p>
          <CategoryRowForm category={null} />
        </div>
      </div>
    </div>
  );
}
