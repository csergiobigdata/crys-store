import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { ImageManager } from "@/components/admin/products/image-manager";
import { ProductForm } from "@/components/admin/products/product-form";
import { VariantManager } from "@/components/admin/products/variant-manager";
import { deleteProductAction } from "@/lib/admin/product-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar produto — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, images:product_images(id, url, alt_text, position), variants:product_variants(*)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  const images = [...(product.images ?? [])].sort((a, b) => a.position - b.position);
  const variants = product.variants ?? [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-plum">
          Editar produto
        </h1>
        <ConfirmActionButton
          label="Excluir produto"
          size="md"
          title={`Excluir "${product.name}"?`}
          description="Se este produto já tiver vendas, ele não será apagado: ficará Inativo (I) com a data de inativação registrada. Sem vendas, será removido definitivamente."
          action={deleteProductAction.bind(null, product.id)}
          redirectOnDelete="/admin/produtos"
        />
      </div>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <ProductForm productId={product.id} categories={categories ?? []} initial={product} />
      </section>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Fotos</h2>
        <div className="mt-4">
          <ImageManager productId={product.id} images={images} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Variações e estoque</h2>
        <p className="mt-1 text-sm text-plum-soft">
          Toda variação precisa de um SKU único. Se o produto não tiver
          opções reais, crie uma única variação sem atributos.
        </p>
        <div className="mt-4">
          <VariantManager productId={product.id} variants={variants} images={images} />
        </div>
      </section>
    </div>
  );
}
