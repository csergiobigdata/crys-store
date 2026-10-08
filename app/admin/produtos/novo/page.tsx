import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/products/product-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Novo produto — Admin" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Novo produto
      </h1>
      <p className="mt-2 text-sm text-plum-soft">
        Depois de salvar, você poderá adicionar fotos e variações.
      </p>

      <div className="mt-8">
        <ProductForm productId={null} categories={categories ?? []} />
      </div>
    </div>
  );
}
