"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { CartLine, CartLineDetails } from "@/lib/cart/types";

type VariantWithProductRow = {
  id: string;
  attributes: Record<string, string>;
  price_override: number | null;
  stock_quantity: number;
  active: boolean;
  product: {
    name: string;
    slug: string;
    base_price: number;
    active: boolean;
    images: { url: string; alt_text: string; position: number }[];
  } | null;
  image: { url: string; alt_text: string } | null;
};

export async function getServerCart(): Promise<CartLine[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("profile_id", user.id);

  return (data ?? []).map((row) => ({
    variantId: row.variant_id,
    quantity: row.quantity,
  }));
}

export async function syncServerCartItem(variantId: string, quantity: number) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();

  if (quantity <= 0) {
    await supabase
      .from("cart_items")
      .delete()
      .eq("profile_id", user.id)
      .eq("variant_id", variantId);
    return;
  }

  await supabase
    .from("cart_items")
    .upsert(
      { profile_id: user.id, variant_id: variantId, quantity },
      { onConflict: "profile_id,variant_id" },
    );
}

export async function clearServerCart() {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("profile_id", user.id);
}

export async function getCartDetails(lines: CartLine[]): Promise<CartLineDetails[]> {
  if (lines.length === 0) return [];

  const supabase = await createClient();
  const ids = lines.map((l) => l.variantId);

  const { data } = await supabase
    .from("product_variants")
    .select(
      "id, attributes, price_override, stock_quantity, active, product:products(name, slug, base_price, active, images:product_images(url, alt_text, position)), image:product_images(url, alt_text)",
    )
    .in("id", ids);

  const rows = (data ?? []) as unknown as VariantWithProductRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));

  return lines
    .map((line) => {
      const row = byId.get(line.variantId);
      if (!row || !row.product) return null;

      // Sem foto própria na variação, usa a primeira foto do produto.
      const fallbackImage = [...(row.product.images ?? [])].sort(
        (a, b) => a.position - b.position,
      )[0];
      const image = row.image ?? fallbackImage ?? null;

      const details: CartLineDetails = {
        variantId: line.variantId,
        quantity: line.quantity,
        productName: row.product.name,
        productSlug: row.product.slug,
        variantAttributes: (row.attributes as Record<string, string>) ?? {},
        unitPrice: Number(row.price_override ?? row.product.base_price),
        imageUrl: image?.url ?? null,
        imageAlt: image?.alt_text || row.product.name,
        stockQuantity: row.stock_quantity,
        active: row.active && row.product.active,
      };
      return details;
    })
    .filter((d): d is CartLineDetails => d !== null);
}
