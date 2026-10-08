import { describe, expect, it } from "vitest";
import { formatCep, formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("formata em Real brasileiro", () => {
    expect(formatCurrency(189.9)).toBe("R$ 189,90");
  });

  it("formata zero corretamente", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });
});

describe("formatCep", () => {
  it("adiciona o hífen em um CEP de 8 dígitos", () => {
    expect(formatCep("01310100")).toBe("01310-100");
  });

  it("mantém o valor original se não tiver 8 dígitos", () => {
    expect(formatCep("123")).toBe("123");
  });
});
