import { isValidCpf } from "@/lib/validations/cpf";

export type PixKeyKind = "cpf" | "cnpj" | "phone" | "email" | "random";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normaliza a chave Pix digitada pelo admin para o formato que o BR Code
 * exige: CPF/CNPJ só com dígitos, telefone como +55DDDNÚMERO, e-mail em
 * minúsculas e chave aleatória (UUID) em minúsculas. Devolve `null` se não
 * parecer nenhum tipo de chave Pix válido.
 */
export function normalizePixKey(raw: string): { key: string; kind: PixKeyKind } | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.includes("@")) {
    return EMAIL.test(value) && value.length <= 77
      ? { key: value.toLowerCase(), kind: "email" }
      : null;
  }

  if (UUID.test(value)) return { key: value.toLowerCase(), kind: "random" };

  const digits = value.replace(/\D/g, "");

  // Telefone: com "+" ou com parênteses/espaços de formatação.
  if (value.startsWith("+")) {
    return digits.length >= 12 && digits.length <= 13 ? { key: `+${digits}`, kind: "phone" } : null;
  }

  if (digits.length === 14) return { key: digits, kind: "cnpj" };

  if (digits.length === 11) {
    // 11 dígitos podem ser CPF ou celular com DDD: o CPF só vale se os dígitos
    // verificadores baterem e o cliente não digitou "(DD)".
    const looksLikePhone = /[()]/.test(value);
    if (!looksLikePhone && isValidCpf(digits)) return { key: digits, kind: "cpf" };
    return { key: `+55${digits}`, kind: "phone" };
  }

  if (digits.length === 10) return { key: `+55${digits}`, kind: "phone" };
  if (digits.length === 13 && digits.startsWith("55")) return { key: `+${digits}`, kind: "phone" };

  return null;
}

/** Mostra só o fim da chave (para logs e telas): ••••1234. */
export function maskPixKey(key: string): string {
  return key.length <= 4 ? "••••" : `••••${key.slice(-4)}`;
}
