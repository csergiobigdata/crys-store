import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Diz se algum item do carrinho é um produto de teste (products.is_test).
 * A decisão é sempre tomada aqui, no servidor, a partir do banco — o
 * navegador só informa quais variações estão no carrinho.
 */
export async function cartHasTestProduct(variantIds: string[]): Promise<boolean> {
  const ids = [...new Set(variantIds)].filter((id) => UUID.test(id)).slice(0, 100);
  if (ids.length === 0) return false;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("product_variants")
    .select("id, product:products(is_test)")
    .in("id", ids);

  return (data ?? []).some((row) => {
    const product = row.product as unknown as { is_test: boolean } | null;
    return product?.is_test === true;
  });
}
