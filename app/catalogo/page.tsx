import type { Metadata } from "next";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { ProductCard } from "@/components/catalog/product-card";
import { AnimatedSection } from "@/components/ui/animated-section";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import {
  type CatalogSort,
  listActiveCategories,
  listCatalogProducts,
} from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Catálogo" };

const validSorts: CatalogSort[] = [
  "relevancia",
  "menor_preco",
  "maior_preco",
  "novidade",
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    busca?: string;
    preco_min?: string;
    preco_max?: string;
    ordenar?: string;
  }>;
}) {
  const params = await searchParams;
  const sort = validSorts.includes(params.ordenar as CatalogSort)
    ? (params.ordenar as CatalogSort)
    : "relevancia";

  const [categories, products, user] = await Promise.all([
    listActiveCategories(),
    listCatalogProducts({
      categorySlug: params.categoria,
      search: params.busca,
      minPrice: params.preco_min ? Number(params.preco_min) : undefined,
      maxPrice: params.preco_max ? Number(params.preco_max) : undefined,
      sort,
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-plum">Catálogo</h1>
        {user?.role === "admin" && (
          <ButtonLink href="/admin/produtos/novo">Novo produto</ButtonLink>
        )}
      </div>
      <p className="mt-2 text-plum-soft">
        {products.length} produto{products.length === 1 ? "" : "s"}{" "}
        encontrado{products.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-6">
        <CatalogFilters categories={categories} />
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-center text-plum-soft">
          Nenhum produto encontrado para esses filtros.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {products.map((product, index) => (
            <AnimatedSection key={product.id} delay={(index % 4) * 0.05}>
              <ProductCard product={product} />
            </AnimatedSection>
          ))}
        </div>
      )}
    </div>
  );
}
