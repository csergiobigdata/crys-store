import { describe, expect, it } from "vitest";
import { contactSchema, MAX_CONTACT_MESSAGE_LENGTH } from "./contact";
import { profileSchema } from "./auth";

describe("contactSchema", () => {
  const valid = {
    name: "Maria Souza",
    email: "maria@exemplo.com",
    message: "Gostaria de saber o prazo de entrega para Atibaia.",
  };

  it("aceita uma mensagem válida", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("recusa e-mail inválido, nome curto e mensagem curta", () => {
    expect(contactSchema.safeParse({ ...valid, email: "maria" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, name: "M" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "oi" }).success).toBe(false);
  });

  it("limita o tamanho da mensagem", () => {
    const long = "a".repeat(MAX_CONTACT_MESSAGE_LENGTH + 1);
    expect(contactSchema.safeParse({ ...valid, message: long }).success).toBe(false);
  });

  it("telefone é opcional", () => {
    const result = contactSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBeUndefined();
  });
});

describe("profileSchema (telefone)", () => {
  const base = { fullName: "Carlos Sergio" };

  it("guarda só os dígitos e tira o 55 do país", () => {
    const result = profileSchema.safeParse({ ...base, phone: "+55 (11) 98649-3333" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("11986493333");
  });

  it("telefone em branco é aceito", () => {
    const result = profileSchema.safeParse({ ...base, phone: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("");
  });

  it("recusa telefone sem DDD", () => {
    expect(profileSchema.safeParse({ ...base, phone: "98649333" }).success).toBe(false);
  });
});
