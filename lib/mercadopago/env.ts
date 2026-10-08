import "server-only";
import { z } from "zod";

const mpEnvSchema = z.object({
  NEXT_PUBLIC_MP_PUBLIC_KEY: z.string().min(1),
  MP_ACCESS_TOKEN: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),
  MP_MAX_INSTALLMENTS: z.coerce.number().int().min(1).max(12).default(6),
});

let cached: z.infer<typeof mpEnvSchema> | null = null;

/** Validado sob demanda — ver nota em lib/pix/env.ts. */
export function getMpEnv() {
  if (!cached) {
    cached = mpEnvSchema.parse({
      NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
      MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
      MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
      MP_MAX_INSTALLMENTS: process.env.MP_MAX_INSTALLMENTS,
    });
  }
  return cached;
}
