import { VariantRowForm } from "@/components/admin/products/variant-row-form";

type Variant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price_override: number | null;
  stock_quantity: number;
  active: boolean;
};

export function VariantManager({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  return (
    <div className="space-y-3">
      {variants.map((variant) => (
        <VariantRowForm
          key={variant.id}
          productId={productId}
          variant={variant}
        />
      ))}

      <div>
        <p className="mb-2 text-sm font-medium text-plum">Nova variação</p>
        <VariantRowForm productId={productId} variant={null} />
      </div>
    </div>
  );
}
