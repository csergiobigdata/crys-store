import { describe, expect, it } from "vitest";
import { computeCouponDiscount } from "./coupon-rules";

describe("computeCouponDiscount", () => {
  it("percentual simples", () => {
    expect(computeCouponDiscount({ type: "percentual", value: 10, subtotal: 100 })).toEqual({
      discount: 10,
      capped: false,
    });
  });

  it("valor fixo dentro do teto", () => {
    expect(computeCouponDiscount({ type: "fixo", value: 20, subtotal: 100 })).toEqual({
      discount: 20,
      capped: false,
    });
  });

  it("valor fixo acima de 30% do pedido é reduzido ao teto", () => {
    expect(computeCouponDiscount({ type: "fixo", value: 50, subtotal: 100 })).toEqual({
      discount: 30,
      capped: true,
    });
  });

  it("percentual acima de 30% (cupom antigo) também respeita o teto", () => {
    expect(computeCouponDiscount({ type: "percentual", value: 50, subtotal: 80 })).toEqual({
      discount: 24,
      capped: true,
    });
  });

  it("nunca passa do subtotal nem fica negativo", () => {
    expect(computeCouponDiscount({ type: "fixo", value: 10, subtotal: 0 }).discount).toBe(0);
  });
});
