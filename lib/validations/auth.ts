import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, { error: "Informe seu nome completo." }),
    email: z.email({ error: "Informe um e-mail válido." }),
    password: z
      .string()
      .min(8, { error: "A senha deve ter ao menos 8 caracteres." })
      .regex(/[a-zA-Z]/, { error: "A senha deve conter ao menos uma letra." })
      .regex(/[0-9]/, { error: "A senha deve conter ao menos um número." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
