import "server-only";
import { z } from "zod";

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  ADMIN_NOTIFICATION_EMAIL: z.email(),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

let cached: z.infer<typeof emailEnvSchema> | null = null;

/** Validado sob demanda — ver nota em lib/pix/env.ts. */
export function getEmailEnv() {
  if (!cached) {
    cached = emailEnvSchema.parse({
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });
  }
  return cached;
}
