import { describe, expect, it } from "vitest";
import { newProductVariantSchema, productSchema, variantSchema } from "./admin-product";

describe("variantSchema", () => {
  it("aceita campos ausentes (FormData.get devolve null)", () => {
    const result = variantSchema.safeParse({
      sku: "CHA-PERS-INICIAL",
      attributeKey1: "personalização",
      attributeValue1: "Inicial",
      attributeKey2: null,
      attributeValue2: null,
      priceOverride: "",
      stockQuantity: "40",
      active: "on",
      imageId: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attributeKey2).toBe("");
      expect(result.data.priceOverride).toBeUndefined();
      expect(result.data.imageId).toBeUndefined();
      expect(result.data.stockQuantity).toBe(40);
      expect(result.data.active).toBe(true);
    }
  });

  it("mantém o preço específico quando informado em formato brasileiro", () => {
    const result = variantSchema.safeParse({
      sku: "X",
      attributeKey1: "",
      attributeValue1: "",
      attributeKey2: "",
      attributeValue2: "",
      priceOverride: " 1.000,00 ",
      stockQuantity: 1,
      active: null,
      imageId: "abc",
    });
    expect(result.success && result.data.priceOverride).toBe(1000);
    expect(result.success && result.data.active).toBe(false);
  });
});

describe("newProductVariantSchema", () => {
  const validVariant = {
    sku: "PANO-01",
    attributeKey1: "nenhum",
    attributeValue1: "",
    priceOverride: "",
    stockQuantity: "1",
    active: "on",
  };

  it("permite salvar sem especificação quando o atributo é nenhum", () => {
    expect(newProductVariantSchema.safeParse(validVariant).success).toBe(true);
  });

  it("exige especificação quando um atributo foi selecionado", () => {
    expect(
      newProductVariantSchema.safeParse({
        ...validVariant,
        attributeKey1: "cor",
      }).success,
    ).toBe(false);
    expect(
      newProductVariantSchema.safeParse({
        ...validVariant,
        attributeKey1: "cor",
        attributeValue1: "Azul",
      }).success,
    ).toBe(true);
  });
});

describe("productSchema", () => {
  const validProduct = {
    name: "Anel",
    slug: "anel",
    description: "Anel artesanal.",
    basePrice: "10,00",
    categoryId: "f635b50e-4dfd-5de5-af86-a37dc8a57f69",
    status: "A",
  };

  it("exige descrição, preço e categoria", () => {
    const result = productSchema.safeParse({
      ...validProduct,
    });
    expect(result.success).toBe(true);
    expect(productSchema.safeParse({ ...validProduct, description: " " }).success).toBe(false);
    expect(productSchema.safeParse({ ...validProduct, categoryId: "" }).success).toBe(false);
    expect(productSchema.safeParse({ ...validProduct, basePrice: "" }).success).toBe(false);
  });

  it("interpreta valores monetários no formato brasileiro", () => {
    for (const [input, expected] of [
      ["1.000,00", 1000],
      ["23.000,00", 23000],
      ["1,00", 1],
    ] as const) {
      const result = productSchema.safeParse({ ...validProduct, basePrice: input });
      expect(result.success && result.data.basePrice).toBe(expected);
    }
  });
});

describe("couponSchema", () => {
  const base = {
    name: "Natal",
    code: "natal10",
    discountType: "percentual",
    discountValue: "10",
    active: "on",
  };

  it("aceita um cupom válido e deixa o código em maiúsculas", async () => {
    const { couponSchema } = await import("./admin-product");
    const result = couponSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("NATAL10");
  });

  it("exige o nome do cupom, de até 10 caracteres", async () => {
    const { couponSchema } = await import("./admin-product");
    expect(couponSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(couponSchema.safeParse({ ...base, name: "1234567890" }).success).toBe(true);
    expect(couponSchema.safeParse({ ...base, name: "12345678901" }).success).toBe(false);
  });

  it("cupom percentual não passa de 30%", async () => {
    const { couponSchema } = await import("./admin-product");
    expect(couponSchema.safeParse({ ...base, discountValue: "30" }).success).toBe(true);
    expect(couponSchema.safeParse({ ...base, discountValue: "30.01" }).success).toBe(false);
  });

  it("valor fixo não é barrado pelo limite de 30% (o teto é aplicado no pedido)", async () => {
    const { couponSchema } = await import("./admin-product");
    expect(
      couponSchema.safeParse({ ...base, discountType: "fixo", discountValue: "50" }).success,
    ).toBe(true);
  });
});
