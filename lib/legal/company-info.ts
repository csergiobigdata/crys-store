import { getPrimaryAdminContact } from "@/lib/site/contact";
import { createClient } from "@/lib/supabase/server";

export type CompanyInfo = {
  razao_social?: string;
  cnpj_ou_cpf?: string;
  endereco?: string;
  /** Contato de atendimento: sempre o e-mail e telefone do administrador principal. */
  contato?: string;
};

/**
 * Lê os dados da empresa de app_settings (editáveis em /admin/configuracoes).
 * O contato de atendimento NÃO é editado ali: vem do administrador principal
 * (ver lib/site/contact.ts), para ter uma única fonte de verdade.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const supabase = await createClient();
  const [{ data }, primaryAdmin] = await Promise.all([
    supabase.from("app_settings").select("value").eq("key", "company_info").maybeSingle(),
    getPrimaryAdminContact(),
  ]);

  const contato = [primaryAdmin?.email, primaryAdmin?.phone].filter(Boolean).join(" · ");
  return { ...(data?.value ?? {}), contato: contato || undefined };
}

export function formatCompanyLine(info: CompanyInfo, field: keyof CompanyInfo, label: string): string {
  return info[field] ? info[field]! : `[REVISAR] ${label} não configurado(a)`;
}
