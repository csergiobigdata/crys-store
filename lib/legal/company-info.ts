import { createClient } from "@/lib/supabase/server";

export type CompanyInfo = {
  razao_social?: string;
  cnpj_ou_cpf?: string;
  endereco?: string;
  contato?: string;
};

/** Lê os dados da empresa de app_settings (editáveis em /admin/configuracoes). */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "company_info")
    .maybeSingle();

  return data?.value ?? {};
}

export function formatCompanyLine(info: CompanyInfo, field: keyof CompanyInfo, label: string): string {
  return info[field] ? info[field]! : `[REVISAR] ${label} não configurado(a)`;
}
