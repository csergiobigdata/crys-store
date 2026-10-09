import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(1, { error: "Informe sua senha." }),
});

/** Regras de senha de toda a loja (cadastro e redefinição). */
const passwordRule = z
  .string()
  .min(8, { error: "A senha deve ter ao menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "A senha deve conter ao menos uma letra." })
  .regex(/[0-9]/, { error: "A senha deve conter ao menos um número." });

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
});

export const resetPasswordSchema = z
  .object({
    tokenHash: z.string().min(10, { error: "Link inválido. Peça um novo." }),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, { error: "Informe seu nome completo." }),
    email: z.email({ error: "Informe um e-mail válido." }),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Informe seu nome completo." }).max(100),
  nickname: z
    .string()
    .trim()
    .max(30, { error: "O apelido deve ter no máximo 30 caracteres." })
    .optional(),
  // Telefone de contato com DDD (só dígitos são guardados). Em branco = não informado.
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "") : ""))
    .refine((value) => value === "" || value.length === 10 || value.length === 11, {
      message: "Informe o telefone com DDD (10 ou 11 dígitos).",
    }),
});
