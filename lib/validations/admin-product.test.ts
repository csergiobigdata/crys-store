import { describe, expect, it } from "vitest";
import { productSchema, variantSchema } from "./admin-product";

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

  it("mantém o preço especial quando informado", () => {
    const result = variantSchema.safeParse({
      sku: "X",
      attributeKey1: "",
      attributeValue1: "",
      attributeKey2: "",
      attributeValue2: "",
      priceOverride: " 29.90 ",
      stockQuantity: 1,
      active: null,
      imageId: "abc",
    });
    expect(result.success && result.data.priceOverride).toBe("29.90");
    expect(result.success && result.data.active).toBe(false);
  });
});

describe("productSchema", () => {
  it("aceita descrição e categoria nulas", () => {
    const result = productSchema.safeParse({
      name: "Anel",
      slug: "anel",
      description: null,
      basePrice: "10",
      categoryId: null,
      status: "A",
    });
    expect(result.success).toBe(true);
  });
});
