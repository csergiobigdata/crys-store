import type { CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CheckoutPrefill = {
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
};

function formatCpf(digits: string) {
  const d = digits.replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : digits;
}

function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

function formatCep(digits: string) {
  const d = digits.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : digits;
}

/**
 * Dados salvos do cliente logado (perfil + endereço padrão) para sugerir no
 * checkout. Tudo é lido com a sessão do próprio usuário, então o RLS garante
 * que ele só enxerga os próprios dados.
 */
export async function getCheckoutPrefill(user: CurrentUser): Promise<CheckoutPrefill> {
  const supabase = await createClient();

  const [{ data: profile }, { data: address }] = await Promise.all([
    supabase.from("profiles").select("cpf, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("cep, street, number, complement, neighborhood, city, state")
      .eq("profile_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    fullName: user.fullName ?? "",
    email: user.email ?? "",
    cpf: profile?.cpf ? formatCpf(profile.cpf) : "",
    phone: profile?.phone ? formatPhone(profile.phone) : "",
    address: {
      cep: address?.cep ? formatCep(address.cep) : "",
      street: address?.street ?? "",
      number: address?.number ?? "",
      complement: address?.complement ?? "",
      neighborhood: address?.neighborhood ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
    },
  };
}
