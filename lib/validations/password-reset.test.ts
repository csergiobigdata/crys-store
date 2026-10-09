import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema } from "./auth";

describe("forgotPasswordSchema", () => {
  it("aceita e-mail válido e recusa inválido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "maria@exemplo.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "maria" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const base = { tokenHash: "abcdefghijklmnop", password: "senha1234", confirmPassword: "senha1234" };

  it("aceita uma senha forte com confirmação igual", () => {
    expect(resetPasswordSchema.safeParse(base).success).toBe(true);
  });

  it("recusa senhas fracas (curta, sem número, sem letra)", () => {
    for (const password of ["abc123", "somenteletras", "12345678"]) {
      expect(
        resetPasswordSchema.safeParse({ ...base, password, confirmPassword: password }).success,
        password,
      ).toBe(false);
    }
  });

  it("recusa confirmação diferente", () => {
    expect(resetPasswordSchema.safeParse({ ...base, confirmPassword: "outra1234" }).success).toBe(false);
  });

  it("exige o token do link", () => {
    expect(resetPasswordSchema.safeParse({ ...base, tokenHash: "" }).success).toBe(false);
  });
});
