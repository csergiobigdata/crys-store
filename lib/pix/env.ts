import "server-only";
import { z } from "zod";

/**
 * Chave Pix, nome e cidade do recebedor só existem em variável de ambiente
 * — nunca chegam ao navegador (item 5.1 da especificação).
 *
 * Validado sob demanda (não no import do módulo): assim, uma página que
 * só condicionalmente usa Pix (ex. a página de pedido, compartilhada com
 * cartão) não exige essas variáveis só por importar este arquivo.
 */
const pixEnvSchema = z.object({
  PIX_KEY: z.string().min(1),
  PIX_MERCHANT_NAME: z.string().min(1).max(25),
  PIX_MERCHANT_CITY: z.string().min(1).max(15),
  PIX_EXPIRATION_HOURS: z.coerce.number().int().positive().default(24),
});

let cached: z.infer<typeof pixEnvSchema> | null = null;

export function getPixEnv() {
  if (!cached) {
    cached = pixEnvSchema.parse({
      PIX_KEY: process.env.PIX_KEY,
      PIX_MERCHANT_NAME: process.env.PIX_MERCHANT_NAME,
      PIX_MERCHANT_CITY: process.env.PIX_MERCHANT_CITY,
      PIX_EXPIRATION_HOURS: process.env.PIX_EXPIRATION_HOURS,
    });
  }
  return cached;
}
