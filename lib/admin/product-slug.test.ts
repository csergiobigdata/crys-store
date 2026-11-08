import { describe, expect, it } from "vitest";
import {
  normalizeProductName,
  slugifyProductName,
  suggestUniqueIdentifier,
} from "./product-slug";

describe("product slug suggestions", () => {
  it("normalizes whitespace and converts Portuguese names to URL slugs", () => {
    expect(normalizeProductName("  Pano   de prato  ")).toBe("Pano de prato");
    expect(slugifyProductName("Pano de prato galo")).toBe("pano-de-prato-galo");
    expect(slugifyProductName("Acessório azul")).toBe("acessorio-azul");
  });

  it("suggests the next four-digit suffix when an identifier already exists", () => {
    expect(
      suggestUniqueIdentifier(
        "pano-de-prato",
        new Set(["pano-de-prato", "pano-de-prato-0001"]),
      ),
    ).toBe("pano-de-prato-0002");
    expect(suggestUniqueIdentifier("camiseta-azul", new Set())).toBe("camiseta-azul");
  });
});
