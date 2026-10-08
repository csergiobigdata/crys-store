import { describe, expect, it } from "vitest";
import { isValidCpf, onlyDigits } from "./cpf";

describe("isValidCpf", () => {
  it("aceita um CPF válido conhecido", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("rejeita CPF com dígito verificador incorreto", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });

  it("rejeita CPF com quantidade errada de dígitos", () => {
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("onlyDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
  });
});
