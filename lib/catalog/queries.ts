import { createClient } from "@/lib/supabase/server";

export type CatalogSort = "relevancia" | "menor_preco" | "maior_preco" | "novidade";

export type CatalogFilters = {
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  categoryName: string | null;
  imageUrl: string | null;
  imageAlt: string;
  inStock: boolean;
};

export async function listActiveCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("active", true)
    .order("name");
  return data ?? [];
}

export async function listCatalogProducts(
  filters: CatalogFilters,
): Promise<CatalogProduct[]> {
  const supabase = await createClient();

  let categoryId: string | null = null;
  if (filters.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    if (!category) return [];
    categoryId = category.id;
  }

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, base_price, created_at, category:categories(name), images:product_images(url, alt_text, position), variants:product_variants(stock_quantity, active)",
    )
    .eq("active", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }
  if (filters.minPrice !== undefined) query = query.gte("base_price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("base_price", filters.maxPrice);

  switch (filters.sort) {
    case "menor_preco":
      query = query.order("base_price", { ascending: true });
      break;
    case "maior_preco":
      query = query.order("base_price", { ascending: false });
      break;
    case "novidade":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("name", { ascending: true });
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as ProductListRow[];

  return rows.map((row) => {
    const sortedImages = [...(row.images ?? [])].sort((a, b) => a.position - b.position);
    const cover = sortedImages[0];
    const inStock = (row.variants ?? []).some((v) => v.active && v.stock_quantity > 0);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      basePrice: Number(row.base_price),
      categoryName: row.category?.name ?? null,
      imageUrl: cover?.url ?? null,
      imageAlt: cover?.alt_text ?? row.name,
      inStock,
    };
  });
}

type ProductListRow = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  created_at: string;
  category: { name: string } | null;
  images: { url: string; alt_text: string; position: number }[];
  variants: { stock_quantity: number; active: boolean }[];
};

type ProductDetailRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  category: { name: string; slug: string } | null;
  images: { id: string; url: string; alt_text: string; position: number }[];
  variants: {
    id: string;
    attributes: Record<string, string>;
    price_override: number | null;
    stock_quantity: number;
    active: boolean;
    image_id: string | null;
  }[];
};

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, base_price, category:categories(name, slug), images:product_images(id, url, alt_text, position), variants:product_variants(id, attributes, price_override, stock_quantity, active, image_id)",
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as ProductDetailRow;

  return {
    ...row,
    images: [...row.images].sort((a, b) => a.position - b.position),
    variants: row.variants.filter((v) => v.active),
  };
}
