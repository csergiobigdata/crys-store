import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Detecta produtos de teste para impedir que um carrinho desatualizado ou
 * manipulado seja usado para criar um pedido.
 */
export async function cartHasTestProduct(variantIds: string[]): Promise<boolean> {
  const ids = [...new Set(variantIds)].filter((id) => UUID.test(id)).slice(0, 100);
  if (ids.length === 0) return false;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product:products(is_test)")
    .in("id", ids);
  if (error) {
    console.error("Falha ao verificar produtos de teste no carrinho:", error.message);
    throw new Error("Não foi possível verificar se o carrinho contém produtos de teste.");
  }

  return (data ?? []).some((row) => {
    const product = row.product as unknown as { is_test: boolean } | null;
    return product?.is_test === true;
  });
}
