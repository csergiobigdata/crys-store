import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/queries";
import { formatCurrency } from "@/lib/utils/format";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block overflow-hidden rounded-3xl border border-rose-light bg-surface shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sky-light">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-plum px-3 py-1 text-xs font-medium text-white">
            Esgotado
          </span>
        )}
      </div>
      <div className="p-4">
        {product.categoryName && (
          <p className="inline-block rounded-full bg-sky-light px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-sky-dark">
            {product.categoryName}
          </p>
        )}
        <h3 className="mt-1 font-medium text-plum">{product.name}</h3>
        <p className="mt-1 font-display text-xl font-semibold text-rose-dark">
          {formatCurrency(product.basePrice)}
        </p>
      </div>
    </Link>
  );
}
