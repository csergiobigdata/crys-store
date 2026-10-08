import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductPurchasePanel } from "@/components/catalog/product-purchase-panel";
import { getProductBySlug } from "@/lib/catalog/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Produto" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div>
          {product.category && (
            <p className="text-xs uppercase tracking-wide text-plum-soft">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-1 font-display text-3xl font-semibold text-plum">
            {product.name}
          </h1>

          <ProductPurchasePanel
            basePrice={Number(product.base_price)}
            variants={product.variants.map((v) => ({
              id: v.id,
              attributes: (v.attributes as Record<string, string>) ?? {},
              priceOverride: v.price_override ? Number(v.price_override) : null,
              stockQuantity: v.stock_quantity,
            }))}
          />

          {product.description && (
            <div className="mt-8 border-t border-rose-light pt-6">
              <h2 className="text-sm font-semibold text-plum">Descrição</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-plum-soft">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
