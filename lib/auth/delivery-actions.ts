"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validations/checkout";

const deliveryDataSchema = checkoutSchema.pick({
  cpf: true,
  phone: true,
  cep: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
});

export type DeliveryFormState = { error?: string; saved?: boolean } | undefined;

/**
 * Salva CPF, telefone e endereço de entrega padrão do cliente logado. Usa a
 * sessão do próprio cliente (não a service role), então o RLS garante que ele
 * só altera os próprios dados.
 */
export async function saveDeliveryDataAction(
  _prevState: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  const parsed = deliveryDataSchema.safeParse({
    cpf: formData.get("cpf"),
    phone: formData.get("phone"),
    cep: formData.get("cep"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados do formulário." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ cpf: data.cpf, phone: data.phone })
    .eq("id", user.id);
  if (profileError) return { error: "Não foi possível salvar seus dados. Tente novamente." };

  const address = {
    cep: data.cep,
    street: data.street,
    number: data.number,
    complement: data.complement || null,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    is_default: true,
  };

  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("profile_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: addressError } = existing
    ? await supabase.from("addresses").update(address).eq("id", existing.id)
    : await supabase
        .from("addresses")
        .insert({ ...address, profile_id: user.id, label: "Entrega" });
  if (addressError) {
    return { error: "Não foi possível salvar o endereço. Tente novamente." };
  }

  revalidatePath("/minha-conta");
  revalidatePath("/checkout");
  return { saved: true };
}
