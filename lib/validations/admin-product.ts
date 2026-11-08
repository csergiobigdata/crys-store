import { z } from "zod";
import {
  MAX_COUPON_CODE_LENGTH,
  MAX_COUPON_NAME_LENGTH,
  MAX_DISCOUNT_PERCENT,
} from "@/lib/orders/coupon-rules";

// FormData.get() devolve null quando o campo não veio no formulário (ex.: a
// linha de variação só tem "Atributo 1"); o zod trataria null como erro.
const optionalText = z
  .string()
  .nullish()
  .transform((value) => value?.trim() ?? "");
const optionalId = z
  .string()
  .nullish()
  .transform((value) => (value ? value : undefined));
const currencyValue = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim().replace(/[R$\s]/g, "");
  if (!text) return undefined;

  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  return Number(normalized);
};
const requiredMoney = z.preprocess(
  currencyValue,
  z.number({ error: "Informe um preço válido." }).positive({
    error: "Informe um preço válido.",
  }),
);
const optionalMoney = z.preprocess(
  currencyValue,
  z.number({ error: "Informe um preço válido." }).nonnegative().optional(),
);
const requiredStock = z.preprocess(
  (value) => (value === null || value === "" ? undefined : Number(value)),
  z.number({ error: "Informe o estoque." }).int().min(0, {
    error: "O estoque deve ser um número inteiro maior ou igual a zero.",
  }),
);

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Informe o nome do produto." })
    .transform((value) => value.replace(/\s+/g, " ")),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Use apenas letras minúsculas, números e hífens.",
    }),
  description: z.string().trim().min(1, { error: "Informe a descrição do produto." }),
  basePrice: requiredMoney,
  categoryId: z.string().uuid({ error: "Selecione uma categoria." }),
  // "A" = ativo, "I" = inativo. Produto novo sempre nasce "A" (a action ignora
  // este campo na criação).
  status: z.enum(["A", "I"]).default("A"),
  // Checkbox: "on" quando marcado, ausente (null) quando não.
  isTest: z.coerce.boolean().default(false),
  isCustomized: z.coerce.boolean().default(false),
});

export const variantSchema = z.object({
  sku: z.string().trim().min(1, { error: "Informe o SKU." }),
  attributeKey1: optionalText,
  attributeValue1: optionalText,
  attributeKey2: optionalText,
  attributeValue2: optionalText,
  priceOverride: optionalMoney,
  stockQuantity: requiredStock,
  active: z.coerce.boolean(),
  imageId: optionalId,
});
export const newProductVariantSchema = variantSchema.extend({
  attributeKey1: z.enum(
    ["cor", "material", "tamanho", "modelo", "estampa", "personalizacao", "acabamento", "formato", "nenhum"],
    { error: "Selecione um atributo ou escolha sem atributo." },
  ),
}).superRefine((variant, ctx) => {
  if (variant.attributeKey1 !== "nenhum" && !variant.attributeValue1) {
    ctx.addIssue({
      code: "custom",
      path: ["attributeValue1"],
      message: "Informe a especificação da variação.",
    });
  }
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome da categoria." }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Use apenas letras minúsculas, números e hífens.",
    }),
  description: optionalText,
  active: z.coerce.boolean(),
});

export const couponSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Informe o nome (apelido) do cupom." })
    .max(MAX_COUPON_NAME_LENGTH, {
      error: `O nome do cupom pode ter no máximo ${MAX_COUPON_NAME_LENGTH} caracteres.`,
    }),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, { error: "Informe o código do cupom." })
    .max(MAX_COUPON_CODE_LENGTH, {
      error: `O código do cupom pode ter no máximo ${MAX_COUPON_CODE_LENGTH} caracteres.`,
    }),
  discountType: z.enum(["percentual", "fixo"]),
  discountValue: z.coerce.number().positive({ error: "Informe um valor válido." }),
  minOrderValue: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  validFrom: z.string().optional().default(""),
  validUntil: z.string().optional().default(""),
  usageLimit: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  active: z.coerce.boolean(),
}).superRefine((coupon, ctx) => {
  if (coupon.discountType === "percentual" && coupon.discountValue > MAX_DISCOUNT_PERCENT) {
    ctx.addIssue({
      code: "custom",
      path: ["discountValue"],
      message: `O desconto percentual não pode passar de ${MAX_DISCOUNT_PERCENT}%.`,
    });
  }
});
