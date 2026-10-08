"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeFileExtension } from "@/lib/utils/safe-extension";
import { productSchema, variantSchema } from "@/lib/validations/admin-product";

export type ActionState = { error: string } | undefined;

export async function upsertProductAction(
  productId: string | null,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados do produto." };
  }

  const supabase = createAdminClient();
  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    base_price: parsed.data.basePrice,
    category_id: parsed.data.categoryId ?? null,
  };

  let id = productId;
  if (id) {
    // A data de inativação é mantida pelo trigger products_sync_status.
    const { error } = await supabase
      .from("products")
      .update({ ...payload, status: parsed.data.status })
      .eq("id", id);
    if (error) return { error: "Não foi possível salvar (o slug já pode estar em uso)." };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({ ...payload, status: "A" })
      .select("id")
      .single();
    if (error || !data) {
      return { error: "Não foi possível criar o produto (o slug já pode estar em uso)." };
    }
    id = data.id;
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "product",
    entity_id: id,
    action: productId ? "update_product" : "create_product",
    changes: productId ? { ...payload, status: parsed.data.status } : { ...payload, status: "A" },
  });

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${id}`);
}

export async function uploadProductImageAction(
  productId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "").trim();

  if (!altText) {
    return { error: "Informe o texto alternativo da imagem (acessibilidade)." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }
  // Allowlist explícita (sem SVG): SVG pode conter <script> e, se alguém
  // abrir a URL pública diretamente, o script roda no domínio do Storage.
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    return { error: "Envie uma imagem JPEG, PNG, WebP ou GIF." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "A imagem deve ter até 5 MB." };
  }

  const supabase = createAdminClient();
  const extension = safeFileExtension(file.name, "jpg");
  const path = `${productId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: "Não foi possível enviar a imagem. Tente novamente." };
  }

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(path);
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  await supabase.from("product_images").insert({
    product_id: productId,
    url: publicUrlData.publicUrl,
    alt_text: altText,
    position: count ?? 0,
  });

  revalidatePath(`/admin/produtos/${productId}`);
  return undefined;
}

export async function deleteProductImageAction(productId: string, imageId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: image } = await supabase
    .from("product_images")
    .select("url")
    .eq("id", imageId)
    .maybeSingle();

  if (image) {
    const path = image.url.split("/product-images/")[1];
    if (path) await supabase.storage.from("product-images").remove([path]);
  }

  await supabase.from("product_images").delete().eq("id", imageId);
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function upsertVariantAction(
  productId: string,
  variantId: string | null,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = variantSchema.safeParse({
    sku: formData.get("sku"),
    attributeKey1: formData.get("attributeKey1"),
    attributeValue1: formData.get("attributeValue1"),
    attributeKey2: formData.get("attributeKey2"),
    attributeValue2: formData.get("attributeValue2"),
    priceOverride: formData.get("priceOverride"),
    stockQuantity: formData.get("stockQuantity"),
    active: formData.get("active"),
    imageId: formData.get("imageId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados da variação." };
  }

  const attributes: Record<string, string> = {};
  if (parsed.data.attributeKey1 && parsed.data.attributeValue1) {
    attributes[parsed.data.attributeKey1] = parsed.data.attributeValue1;
  }
  if (parsed.data.attributeKey2 && parsed.data.attributeValue2) {
    attributes[parsed.data.attributeKey2] = parsed.data.attributeValue2;
  }

  const supabase = createAdminClient();
  const payload = {
    product_id: productId,
    sku: parsed.data.sku,
    attributes,
    price_override: parsed.data.priceOverride ? Number(parsed.data.priceOverride) : null,
    stock_quantity: parsed.data.stockQuantity,
    active: parsed.data.active,
    image_id: parsed.data.imageId ?? null,
  };

  const { error } = variantId
    ? await supabase.from("product_variants").update(payload).eq("id", variantId)
    : await supabase.from("product_variants").insert(payload);

  if (error) {
    return { error: "Não foi possível salvar a variação (o SKU já pode estar em uso)." };
  }

  revalidatePath(`/admin/produtos/${productId}`);
  return undefined;
}

export async function deleteVariantAction(productId: string, variantId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Variação que já foi vendida não pode sumir (o histórico de pedidos aponta
  // para ela): só deixa de ser vendável.
  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("variant_id", variantId);

  if (count && count > 0) {
    await supabase.from("product_variants").update({ active: false }).eq("id", variantId);
  } else {
    await supabase.from("product_variants").delete().eq("id", variantId);
  }
  revalidatePath(`/admin/produtos/${productId}`);
}

export type DeleteResult = {
  error?: string;
  /** Mensagem de sucesso para exibir ao admin. */
  notice?: string;
  /** true quando o registro foi realmente apagado do banco. */
  deleted?: boolean;
};

/**
 * Exclui um produto com a regra de negócio da loja: se ele já teve venda,
 * NÃO é removido do banco — vira inativo ("I") e guarda a data de inativação
 * (trigger products_sync_status). Sem vendas, é apagado de verdade.
 * A confirmação do admin acontece na interface antes de chamar esta action.
 */
export async function deleteProductAction(productId: string): Promise<DeleteResult> {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, variants:product_variants(id), images:product_images(url)")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { error: "Produto não encontrado." };

  const variantIds = (product.variants ?? []).map((v: { id: string }) => v.id);
  let hasSales = false;
  if (variantIds.length > 0) {
    const { count } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .in("variant_id", variantIds);
    hasSales = Boolean(count && count > 0);
  }

  if (hasSales) {
    const { error } = await supabase
      .from("products")
      .update({ status: "I" })
      .eq("id", productId);
    if (error) return { error: "Não foi possível inativar o produto." };

    await supabase.from("audit_log").insert({
      actor_profile_id: admin.id,
      entity_type: "product",
      entity_id: productId,
      action: "inactivate_product",
      changes: { name: product.name, reason: "has_sales" },
    });
    revalidatePath("/admin/produtos");
    revalidatePath(`/admin/produtos/${productId}`);
    return {
      notice:
        "Este produto já tem vendas no histórico, então não foi removido: ele foi marcado como Inativo (I) e a data de inativação foi registrada.",
    };
  }

  // Remove do Storage só as fotos que estão no nosso bucket.
  const storagePaths = (product.images ?? [])
    .map((image: { url: string }) => image.url.split("/product-images/")[1])
    .filter((path: string | undefined): path is string => Boolean(path));
  if (storagePaths.length > 0) {
    await supabase.storage.from("product-images").remove(storagePaths);
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: "Não foi possível excluir o produto." };

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "product",
    entity_id: productId,
    action: "delete_product",
    changes: { name: product.name },
  });
  revalidatePath("/admin/produtos");
  return { deleted: true, notice: "Produto excluído." };
}
