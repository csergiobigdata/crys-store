import { MAX_COUPON_CODE_LENGTH } from "@/lib/orders/coupon-rules";
import { z } from "zod";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart/types";
import { isValidCpf, onlyDigits } from "@/lib/validations/cpf";

export const cartLineSchema = z.object({
  variantId: z.uuid(),
  quantity: z
    .number()
    .int()
    .positive({ error: "Quantidade inválida no carrinho." })
    .max(MAX_QUANTITY_PER_ITEM, {
      error: `Cada item pode ter no máximo ${MAX_QUANTITY_PER_ITEM} unidades por pedido. Ajuste o carrinho.`,
    }),
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Informe seu nome completo." }),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine(isValidCpf, { error: "CPF inválido." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length >= 10 && v.length <= 11, {
      error: "Informe um telefone válido com DDD.",
    }),
  cep: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 8, { error: "CEP inválido." }),
  street: z.string().trim().min(2, { error: "Informe a rua." }),
  number: z.string().trim().min(1, { error: "Informe o número." }),
  complement: z.string().trim().optional().default(""),
  neighborhood: z.string().trim().min(1, { error: "Informe o bairro." }),
  city: z.string().trim().min(1, { error: "Informe a cidade." }),
  state: z
    .string()
    .trim()
    .length(2, { error: "Informe a UF (2 letras)." })
    .transform((v) => v.toUpperCase()),
  paymentMethod: z.enum(["pix", "cartao"], { error: "Escolha a forma de pagamento." }),
  shippingMethod: z.enum(["pac", "sedex", "mini", "same_day", "next_day", "local_arranged", "motoboy"], {
    error: "Escolha uma opção de envio.",
  }),
  couponCode: z
    .string()
    .trim()
    .max(MAX_COUPON_CODE_LENGTH, {
      error: `O código do cupom tem no máximo ${MAX_COUPON_CODE_LENGTH} caracteres.`,
    })
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  items: z
    .array(cartLineSchema)
    .min(1, { error: "Seu carrinho está vazio." })
    .max(50, { error: "Carrinho com muitos itens. Divida em mais de um pedido." }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
