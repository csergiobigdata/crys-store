import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout";

const validPayload = {
  fullName: "Maria Souza",
  cpf: "529.982.247-25",
  email: "maria@example.com",
  phone: "(11) 91234-5678",
  cep: "01310-100",
  street: "Av. Paulista",
  number: "1000",
  complement: "",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "sp",
  paymentMethod: "pix",
  shippingMethod: "pac",
  items: [{ variantId: "11111111-1111-4111-8111-111111111111", quantity: 2 }],
};

describe("checkoutSchema", () => {
  it("aceita um payload válido e normaliza os campos", () => {
    const result = checkoutSchema.parse(validPayload);
    expect(result.cpf).toBe("52998224725");
    expect(result.phone).toBe("11912345678");
    expect(result.cep).toBe("01310100");
    expect(result.state).toBe("SP");
  });

  it("rejeita CPF inválido", () => {
    const result = checkoutSchema.safeParse({ ...validPayload, cpf: "111.111.111-11" });
    expect(result.success).toBe(false);
  });

  it("rejeita carrinho vazio", () => {
    const result = checkoutSchema.safeParse({ ...validPayload, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejeita forma de pagamento inválida", () => {
    const result = checkoutSchema.safeParse({ ...validPayload, paymentMethod: "boleto" });
    expect(result.success).toBe(false);
  });
});
