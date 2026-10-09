"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState, DeleteResult } from "@/lib/admin/product-actions";
import { MAX_CATEGORIES } from "@/lib/admin/category-limit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorySchema } from "@/lib/validations/admin-product";

export async function upsertCategoryAction(
  categoryId: string | null,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados da categoria." };
  }

  const supabase = createAdminClient();
  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    active: parsed.data.active,
  };

  let id = categoryId;
  if (id) {
    const { error } = await supabase.from("categories").update(payload).eq("id", id);
    if (error) return { error: "Não foi possível salvar (o slug já pode estar em uso)." };
  } else {
    const { count } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_CATEGORIES) {
      return {
        error: `Limite atingido: a loja pode ter no máximo ${MAX_CATEGORIES} categorias. Exclua uma que não use mais para criar outra.`,
      };
    }

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select("id")
      .single();
    if (error?.message.includes("max_categories_reached")) {
      return {
        error: `Limite atingido: a loja pode ter no máximo ${MAX_CATEGORIES} categorias.`,
      };
    }
    if (error || !data) {
      return { error: "Não foi possível criar a categoria (o slug já pode estar em uso)." };
    }
    id = data.id;
  }

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "category",
    entity_id: id,
    action: categoryId ? "update_category" : "create_category",
    changes: payload,
  });

  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

/**
 * Exclui uma categoria (a confirmação acontece na interface). Se ainda há
 * produtos nela, não exclui: o admin precisa movê-los antes ou apenas
 * desmarcar "Ativa" para escondê-la da loja.
 */
export async function deleteCategoryAction(categoryId: string): Promise<DeleteResult> {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return { error: "Categoria não encontrada." };

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  if (count && count > 0) {
    return {
      error: `Esta categoria ainda tem ${count} produto(s). Mova-os para outra categoria ou desmarque "Ativa" para escondê-la da loja.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) return { error: "Não foi possível excluir a categoria." };

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "category",
    entity_id: categoryId,
    action: "delete_category",
    changes: { name: category.name },
  });
  revalidatePath("/admin/categorias");
  return { deleted: true, notice: "Categoria excluída." };
}
