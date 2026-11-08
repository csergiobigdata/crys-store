import type { Metadata } from "next";
import { ProductCreationForm } from "@/components/admin/products/product-creation-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Novo produto — Admin" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Novo produto
      </h1>
      <p className="mt-2 text-sm text-plum-soft">
        Preencha os dados, adicione uma foto e cadastre ao menos um SKU para salvar e disponibilizar o produto.
      </p>

      <div className="mt-8">
        <ProductCreationForm categories={categories ?? []} />
      </div>
    </div>
  );
}
