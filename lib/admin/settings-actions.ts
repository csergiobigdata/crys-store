"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/product-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { maskPixKey } from "@/lib/pix/key";
import { createAdminClient } from "@/lib/supabase/admin";
import { generalSettingsSchema } from "@/lib/validations/admin-settings";

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
