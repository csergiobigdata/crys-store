import { z } from "zod";
import {
  containsOffensiveLanguage,
  OFFENSIVE_LANGUAGE_MESSAGE,
} from "@/lib/validations/profanity";

export const MAX_CONTACT_MESSAGE_LENGTH = 2000;

export const contactSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o seu nome." }).max(100),
  email: z.email({ error: "Informe um e-mail válido." }).max(160),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((value) => value || undefined),
  message: z
    .string()
    .trim()
    .min(10, { error: "Escreva uma mensagem com pelo menos 10 caracteres." })
    .max(MAX_CONTACT_MESSAGE_LENGTH, {
      error: `A mensagem pode ter no máximo ${MAX_CONTACT_MESSAGE_LENGTH} caracteres.`,
    })
    .refine((value) => !containsOffensiveLanguage(value), {
      message: OFFENSIVE_LANGUAGE_MESSAGE,
    }),
});

export type ContactInput = z.infer<typeof contactSchema>;
