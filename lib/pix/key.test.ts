import { describe, expect, it } from "vitest";
import { maskPixKey, normalizePixKey } from "./key";

describe("normalizePixKey", () => {
  it("CPF com pontuação vira só dígitos", () => {
    expect(normalizePixKey("529.982.247-25")).toEqual({ key: "52998224725", kind: "cpf" });
  });

  it("CNPJ com pontuação vira só dígitos", () => {
    expect(normalizePixKey("11.222.333/0001-81")).toEqual({ key: "11222333000181", kind: "cnpj" });
  });

  it("celular formatado vira +55", () => {
    expect(normalizePixKey("(11) 98649-3333")).toEqual({ key: "+5511986493333", kind: "phone" });
  });

  it("celular com +55 mantém o formato", () => {
    expect(normalizePixKey("+55 11 98649-3333")).toEqual({ key: "+5511986493333", kind: "phone" });
  });

  it("11 dígitos que não são CPF válido são tratados como celular", () => {
    expect(normalizePixKey("11986493333")).toEqual({ key: "+5511986493333", kind: "phone" });
  });

  it("e-mail em minúsculas", () => {
    expect(normalizePixKey(" Loja@ChrysStore.com.br ")).toEqual({
      key: "loja@chrysstore.com.br",
      kind: "email",
    });
  });

  it("chave aleatória (UUID) em minúsculas", () => {
    expect(normalizePixKey("123E4567-E89B-12D3-A456-426614174000")).toEqual({
      key: "123e4567-e89b-12d3-a456-426614174000",
      kind: "random",
    });
  });

  it("rejeita valores que não são chave Pix", () => {
    expect(normalizePixKey("")).toBeNull();
    expect(normalizePixKey("abc")).toBeNull();
    expect(normalizePixKey("12345")).toBeNull();
    expect(normalizePixKey("a@b")).toBeNull();
  });
});

describe("maskPixKey", () => {
  it("esconde tudo menos o fim", () => {
    expect(maskPixKey("52998224725")).toBe("••••4725");
  });
});
