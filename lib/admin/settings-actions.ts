"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/product-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { geocodeCep } from "@/lib/orders/geocode";
import { MAX_LOCAL_TIERS } from "@/lib/orders/local-delivery";
import { maskPixKey } from "@/lib/pix/key";
import { createAdminClient } from "@/lib/supabase/admin";
import { generalSettingsSchema, localDeliverySchema } from "@/lib/validations/admin-settings";

export async function updateGeneralSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = generalSettingsSchema.safeParse({
    pixExpirationHours: formData.get("pixExpirationHours"),
    mpMaxInstallments: formData.get("mpMaxInstallments"),
    pixKey: formData.get("pixKey"),
    pixMerchantName: formData.get("pixMerchantName"),
    pixMerchantCity: formData.get("pixMerchantCity"),
    companyRazaoSocial: formData.get("companyRazaoSocial"),
    companyCnpjOuCpf: formData.get("companyCnpjOuCpf"),
    companyEndereco: formData.get("companyEndereco"),
    companyContato: formData.get("companyContato"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise as configurações." };
  }

  const supabase = createAdminClient();
  const companyInfo = {
    razao_social: parsed.data.companyRazaoSocial,
    cnpj_ou_cpf: parsed.data.companyCnpjOuCpf,
    endereco: parsed.data.companyEndereco,
    contato: parsed.data.companyContato,
  };

  await supabase.from("app_settings").upsert([
    { key: "pix_expiration_hours", value: parsed.data.pixExpirationHours },
    { key: "mp_max_installments", value: parsed.data.mpMaxInstallments },
    { key: "company_info", value: companyInfo },
    {
      key: "pix_config",
      value: {
        key: parsed.data.pixKey,
        merchant_name: parsed.data.pixMerchantName,
        merchant_city: parsed.data.pixMerchantCity,
      },
    },
  ]);

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "app_settings",
    entity_id: admin.id,
    action: "update_general_settings",
    changes: {
      pix_expiration_hours: parsed.data.pixExpirationHours,
      mp_max_installments: parsed.data.mpMaxInstallments,
      company_info: companyInfo,
      // a chave inteira não vai para o log de auditoria
      pix_config: {
        key: maskPixKey(parsed.data.pixKey),
        merchant_name: parsed.data.pixMerchantName,
        merchant_city: parsed.data.pixMerchantCity,
      },
    },
  });

  revalidatePath("/admin/configuracoes");
  return undefined;
}

/** "35,50" ou "35.50" -> 35.5; vazio -> null; texto inválido -> NaN. */
function parseDecimal(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(",", ".");
  if (text === "") return null;
  return Number(text);
}

export async function updateLocalDeliveryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const tiers: { upToKm: number; fee: number }[] = [];
  for (let i = 0; i < MAX_LOCAL_TIERS; i++) {
    const km = parseDecimal(formData.get(`tierKm_${i}`));
    const fee = parseDecimal(formData.get(`tierFee_${i}`));
    if (km === null && fee === null) continue;
    if (km === null || fee === null || Number.isNaN(km) || Number.isNaN(fee)) {
      return { error: `Faixa ${i + 1}: preencha o raio (km) e a taxa (R$) com números.` };
    }
    tiers.push({ upToKm: km, fee });
  }

  const lat = parseDecimal(formData.get("originLat"));
  const lng = parseDecimal(formData.get("originLng"));
  const motoboyFee = parseDecimal(formData.get("motoboyFee"));
  if ((lat !== null && Number.isNaN(lat)) || (lng !== null && Number.isNaN(lng))) {
    return { error: "Latitude e longitude devem ser números (ex.: -23.1171 e -46.5502)." };
  }
  if (motoboyFee === null || Number.isNaN(motoboyFee)) {
    return { error: "Informe o valor padrão do motoboy." };
  }

  const parsed = localDeliverySchema.safeParse({
    originCep: formData.get("originCep"),
    originLat: lat,
    originLng: lng,
    tiers,
    motoboyFee,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise a entrega local." };
  }

  // Sem coordenadas informadas, localiza o CEP da loja no mapa.
  let originLat = parsed.data.originLat;
  let originLng = parsed.data.originLng;
  if (originLat === null || originLng === null) {
    const located = await geocodeCep(parsed.data.originCep);
    if (!located) {
      return {
        error:
          "Não foi possível localizar o CEP da loja no mapa. Informe a latitude e a longitude manualmente.",
      };
    }
    originLat = located.lat;
    originLng = located.lng;
  }

  const cep = parsed.data.originCep;
  const value = {
    originCep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
    originLat,
    originLng,
    tiers: parsed.data.tiers,
    motoboyFee: parsed.data.motoboyFee,
  };

  const supabase = createAdminClient();
  const { error } = await supabase.from("app_settings").upsert({ key: "local_delivery", value });
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  await supabase.from("audit_log").insert({
    actor_profile_id: admin.id,
    entity_type: "app_settings",
    entity_id: admin.id,
    action: "update_local_delivery",
    changes: value,
  });

  revalidatePath("/admin/configuracoes");
  return undefined;
}
