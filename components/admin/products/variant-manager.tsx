import { VariantRowForm } from "@/components/admin/products/variant-row-form";

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

export function VariantManager({
  productId,
  variants,
  images,
}: {
  productId: string;
  variants: Variant[];
  images: ProductImage[];
}) {
  return (
    <div className="space-y-3">
      {variants.map((variant) => (
        <VariantRowForm
          key={variant.id}
          productId={productId}
          variant={variant}
          images={images}
        />
      ))}

      <div>
        <p className="mb-2 text-sm font-medium text-plum">Nova variação</p>
        <VariantRowForm productId={productId} variant={null} images={images} />
      </div>
    </div>
  );
}
