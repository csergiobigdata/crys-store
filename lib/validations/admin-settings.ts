import { z } from "zod";
import { normalizePixKey } from "@/lib/pix/key";

export const generalSettingsSchema = z.object({
  pixExpirationHours: z.coerce.number().int().positive(),
  mpMaxInstallments: z.coerce.number().int().min(1).max(12),
  // Dados do recebedor do Pix: a chave é normalizada (CPF/CNPJ só com dígitos,
  // telefone com +55 etc.) para o QR Code sair no formato que o banco exige.
  pixKey: z
    .string()
    .trim()
    .min(1, { error: "Informe a chave Pix." })
    .transform((value, ctx) => {
      const normalized = normalizePixKey(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message:
            "Chave Pix inválida. Use CPF, CNPJ, e-mail, telefone (com DDD) ou a chave aleatória.",
        });
        return z.NEVER;
      }
      return normalized.key;
    }),
  pixMerchantName: z
    .string()
    .trim()
    .min(1, { error: "Informe o nome do recebedor do Pix." })
    .max(25, { error: "O nome do recebedor do Pix pode ter no máximo 25 caracteres." }),
  pixMerchantCity: z
    .string()
    .trim()
    .min(1, { error: "Informe a cidade do recebedor do Pix." })
    .max(15, { error: "A cidade do recebedor do Pix pode ter no máximo 15 caracteres." }),
  companyRazaoSocial: z.string().trim().min(1),
  // Opcionais: vazio = não aparece em nenhuma página do site.
  companyCnpjOuCpf: z.string().trim().default(""),
  companyEndereco: z.string().trim().default(""),
  companyContato: z.string().trim().min(1),
});
