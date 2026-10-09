import { z } from "zod";
import { MAX_LOCAL_FEE, MAX_LOCAL_TIERS } from "@/lib/orders/local-delivery";
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

export const localDeliverySchema = z.object({
  originCep: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, { message: "Informe o CEP da loja com 8 dígitos." }),
  originLat: z.number().min(-34).max(6).nullable(),
  originLng: z.number().min(-74).max(-28).nullable(),
  tiers: z
    .array(
      z.object({
        upToKm: z
          .number()
          .positive({ message: "O raio de cada faixa deve ser maior que zero." })
          .max(100, { message: "O raio máximo de uma faixa é 100 km." }),
        fee: z
          .number()
          .min(0, { message: "A taxa não pode ser negativa." })
          .max(MAX_LOCAL_FEE, {
            message: `A taxa máxima da entrega local é R$ ${MAX_LOCAL_FEE.toFixed(2).replace(".", ",")}.`,
          }),
      }),
    )
    .min(1, { message: "Cadastre ao menos uma faixa de distância." })
    .max(MAX_LOCAL_TIERS, { message: `Use no máximo ${MAX_LOCAL_TIERS} faixas.` })
    .refine((tiers) => tiers.every((tier, i) => i === 0 || tier.upToKm > tiers[i - 1].upToKm), {
      message: "Os raios das faixas devem ser crescentes (ex.: 10 km, depois 20 km).",
    }),
  motoboyFee: z
    .number()
    .min(0, { message: "O valor do motoboy não pode ser negativo." })
    .max(MAX_LOCAL_FEE, {
      message: `O valor máximo do motoboy é R$ ${MAX_LOCAL_FEE.toFixed(2).replace(".", ",")}.`,
    }),
});
