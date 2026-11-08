"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeFileExtension } from "@/lib/utils/safe-extension";
import {
  newProductVariantSchema,
  productSchema,
  variantSchema,
} from "@/lib/validations/admin-product";
import {
  normalizeProductName,
  slugifyProductName,
  suggestUniqueIdentifier,
} from "@/lib/admin/product-slug";

export type ActionState = { error: string } | undefined;

export async function suggestProductFields(name: string) {
  await requireAdmin();
  const normalizedName = normalizeProductName(name);
  const baseSlug = slugifyProductName(normalizedName);
  if (!baseSlug) return { error: "Digite um nome que possa ser convertido em slug." };

  const supabase = createAdminClient();
  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabase.from("products").select("name, slug"),
      supabase.from("product_variants").select("sku"),
    ]);

  if (productsError || variantsError) {
    console.error("Falha ao consultar nomes, slugs ou SKUs para sugestão:", {
      productsError: productsError?.message,
      variantsError: variantsError?.message,
    });
    return { error: "Não foi possível verificar nomes, slugs e SKUs agora." };
  }

  const duplicateName = (products ?? []).some(
    (product) =>
      normalizeProductName(product.name).toLocaleLowerCase("pt-BR") ===
      normalizedName.toLocaleLowerCase("pt-BR"),
  );
  const slug = suggestUniqueIdentifier(
    baseSlug,
    new Set((products ?? []).map((product) => product.slug)),
  );
  const sku = suggestUniqueIdentifier(
    slug.toUpperCase(),
    new Set((variants ?? []).map((variant) => variant.sku.toUpperCase())),
  );

  return { slug, sku, duplicateName };
}

export async function suggestProductSlug(slugValue: string) {
  await requireAdmin();
  const baseSlug = slugifyProductName(slugValue);
  if (!baseSlug) return { error: "Informe um slug válido." };

  const supabase = createAdminClient();
  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabase.from("products").select("slug"),
      supabase.from("product_variants").select("sku"),
    ]);

  if (productsError || variantsError) {
    console.error("Falha ao verificar slug e SKU:", {
      productsError: productsError?.message,
      variantsError: variantsError?.message,
    });
    return { error: "Não foi possível verificar o slug agora." };
  }

  const slug = suggestUniqueIdentifier(
    baseSlug,
    new Set((products ?? []).map((product) => product.slug)),
  );
  const sku = suggestUniqueIdentifier(
    slug.toUpperCase(),
    new Set((variants ?? []).map((variant) => variant.sku.toUpperCase())),
  );
  return { slug, sku, adjusted: slug !== slugValue };
}

export async function upsertProductAction(
  productId: string | null,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!productId) {
    return { error: "Use o cadastro completo para criar um produto com foto e SKU." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status") ?? undefined,
    isTest: formData.get("isTest") === "on",
    isCustomized: formData.get("isCustomized") === "on",
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
    category_id: parsed.data.categoryId,
    is_test: parsed.data.isTest,
    is_customized: parsed.data.isCustomized,
  };

  // A data de inativação é mantida pelo trigger products_sync_status.
  const { error } = await supabase
    .from("products")
    .update({ ...payload, status: parsed.data.status })
    .eq("id", productId);
  if (error) {
    return { error: productSaveError(error, "Não foi possível salvar o produto.") };
  }

  const { error: auditError } = await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "product",
    entity_id: productId,
    action: "update_product",
    changes: { ...payload, status: parsed.data.status },
  });
  if (auditError) console.error("Falha ao registrar edição de produto:", auditError.message);

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${productId}`);
}

export async function createProductWithDetailsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsedProduct = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    categoryId: formData.get("categoryId"),
    isTest: formData.get("isTest") === "on",
    isCustomized: formData.get("isCustomized") === "on",
  });
  if (!parsedProduct.success) {
    return {
      error: parsedProduct.error.issues[0]?.message ?? "Revise os dados do produto.",
    };
  }

  const parsedVariant = newProductVariantSchema.safeParse({
    sku: formData.get("sku"),
    attributeKey1: formData.get("attributeKey1"),
    attributeValue1: getSpecification(formData, 1),
    attributeKey2: formData.get("attributeKey2"),
    attributeValue2: getSpecification(formData, 2),
    priceOverride: formData.get("priceOverride"),
    stockQuantity: formData.get("stockQuantity"),
    active: formData.get("active"),
  });
  if (!parsedVariant.success) {
    return {
      error: parsedVariant.error.issues[0]?.message ?? "Revise os dados do SKU.",
    };
  }

  const file = formData.get("productImage");
  const altText = String(formData.get("altText") ?? "").trim();
  if (!altText) return { error: "Informe a descrição da foto do produto." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Adicione a foto principal do produto." };
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    return { error: "Envie uma imagem JPEG, PNG, WebP ou GIF." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "A imagem deve ter até 5 MB." };
  }

  const supabase = createAdminClient();
  const productPayload = {
    name: parsedProduct.data.name,
    slug: parsedProduct.data.slug,
    description: parsedProduct.data.description,
    base_price: parsedProduct.data.basePrice,
    category_id: parsedProduct.data.categoryId,
    is_test: parsedProduct.data.isTest,
    is_customized: parsedProduct.data.isCustomized,
  };
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ ...productPayload, status: "I" })
    .select("id")
    .single();

  if (productError || !product) {
    if (productError) {
      return {
        error: productSaveError(productError, "Não foi possível criar o produto."),
      };
    }
    return { error: "Não foi possível criar o produto. Tente novamente." };
  }

  const extension = safeFileExtension(file.name, "jpg");
  const storagePath = `${product.id}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    const cleanup = await rollbackIncompleteProduct(supabase, product.id);
    return {
      error: rollbackError(
        "Não foi possível enviar a foto. Tente novamente.",
        cleanup,
      ),
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath);
  const { error: imageError } = await supabase.from("product_images").insert({
    product_id: product.id,
    url: publicUrlData.publicUrl,
    alt_text: altText,
    position: 0,
  });
  if (imageError) {
    const cleanup = await rollbackIncompleteProduct(supabase, product.id, storagePath);
    return {
      error: rollbackError(
        "Não foi possível salvar a foto do produto. Tente novamente.",
        cleanup,
      ),
    };
  }

  const attributes: Record<string, string> = {};
  if (parsedVariant.data.attributeKey1 !== "nenhum") {
    attributes[parsedVariant.data.attributeKey1] = parsedVariant.data.attributeValue1;
  }
  if (parsedVariant.data.attributeKey2) {
    attributes[parsedVariant.data.attributeKey2] = parsedVariant.data.attributeValue2;
  }

  const { error: variantError } = await supabase.from("product_variants").insert({
    product_id: product.id,
    sku: parsedVariant.data.sku,
    attributes,
    price_override: parsedVariant.data.priceOverride ?? null,
    stock_quantity: parsedVariant.data.stockQuantity,
    active: parsedVariant.data.active,
  });
  if (variantError) {
    const cleanup = await rollbackIncompleteProduct(supabase, product.id, storagePath);
    return {
      error: rollbackError(
        productSaveError(variantError, "Não foi possível salvar o SKU."),
        cleanup,
      ),
    };
  }

  const { error: activateError } = await supabase
    .from("products")
    .update({ status: "A" })
    .eq("id", product.id);
  if (activateError) {
    const cleanup = await rollbackIncompleteProduct(supabase, product.id, storagePath);
    return {
      error: rollbackError(
        "Não foi possível ativar o produto após o cadastro. Tente novamente.",
        cleanup,
      ),
    };
  }

  const { error: auditError } = await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "product",
    entity_id: product.id,
    action: "create_product",
    changes: { ...productPayload, status: "A" },
  });
  if (auditError) console.error("Falha ao registrar criação de produto:", auditError.message);

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${product.id}`);
}

function getSpecification(formData: FormData, index: 1 | 2) {
  const value = formData.get(`attributeValue${index}`);
  if (value === "__outra_cor__") {
    return formData.get(`attributeValue${index}Custom`);
  }
  return value;
}

async function rollbackIncompleteProduct(
  supabase: ReturnType<typeof createAdminClient>,
  productId: string,
  storagePath?: string,
) {
  let storageDeleted = true;
  if (storagePath) {
    const { error } = await supabase.storage.from("product-images").remove([storagePath]);
    if (error) {
      console.error("Falha ao remover foto de cadastro incompleto:", error.message);
      storageDeleted = false;
    }
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    console.error("Falha ao remover produto incompleto:", error.message);
  }
  return { productDeleted: !error, storageDeleted };
}

function rollbackError(
  failureMessage: string,
  cleanup: { productDeleted: boolean; storageDeleted: boolean },
) {
  if (!cleanup.productDeleted) {
    return "O produto ficou inativo após uma falha no cadastro. Confira o cadastro antes de tentar novamente.";
  }
  if (!cleanup.storageDeleted) {
    return `${failureMessage} A foto temporária não pôde ser removida automaticamente.`;
  }
  return failureMessage;
}

function productSaveError(
  error: { code?: string; message: string; details?: string | null },
  fallback: string,
) {
  const errorText = `${error.message} ${error.details ?? ""}`.toLowerCase();
  if (error.code === "23505" && errorText.includes("products_name_unique_idx")) {
    return "Já existe um produto com esse nome. Diferencie-o por uma característica, como cor, tipo ou material.";
  }
  if (error.code === "23505" && errorText.includes("products_slug_key")) {
    return "Esse slug já está em uso. Escolha outro ou acrescente um número sequencial.";
  }
  if (error.code === "23505" && errorText.includes("product_variants_sku_key")) {
    return "Esse SKU já está em uso. Escolha outro código para a variação.";
  }

  console.error("Falha ao salvar dados do produto:", error.message);
  return fallback;
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

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    url: publicUrlData.publicUrl,
    alt_text: altText,
    position: count ?? 0,
  });

  if (insertError) {
    await supabase.storage.from("product-images").remove([path]);
    return { error: "Não foi possível salvar a imagem no produto. Tente novamente." };
  }

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
    attributeValue1: getSpecification(formData, 1),
    attributeKey2: formData.get("attributeKey2"),
    attributeValue2: getSpecification(formData, 2),
    priceOverride: formData.get("priceOverride"),
    stockQuantity: formData.get("stockQuantity"),
    active: formData.get("active"),
    imageId: formData.get("imageId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados da variação." };
  }

  const attributes: Record<string, string> = {};
  if (
    parsed.data.attributeKey1 &&
    parsed.data.attributeKey1 !== "nenhum" &&
    parsed.data.attributeValue1
  ) {
    attributes[parsed.data.attributeKey1] = parsed.data.attributeValue1;
  }
  if (
    parsed.data.attributeKey2 &&
    parsed.data.attributeKey2 !== "nenhum" &&
    parsed.data.attributeValue2
  ) {
    attributes[parsed.data.attributeKey2] = parsed.data.attributeValue2;
  }

  const supabase = createAdminClient();
  const payload = {
    product_id: productId,
    sku: parsed.data.sku,
    attributes,
    price_override: parsed.data.priceOverride ?? null,
    stock_quantity: parsed.data.stockQuantity,
    active: parsed.data.active,
  };

  const { error } = variantId
    ? await supabase.from("product_variants").update(payload).eq("id", variantId)
    : await supabase.from("product_variants").insert(payload);

  if (error) {
    return {
      error: productSaveError(
        error,
        "Não foi possível salvar a variação. Verifique se o SKU já está em uso.",
      ),
    };
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
