"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

type Variant = {
  id: string;
  attributes: Record<string, string>;
  priceOverride: number | null;
  stockQuantity: number;
};

export function ProductPurchasePanel({
  basePrice,
  variants,
}: {
  basePrice: number;
  variants: Variant[];
}) {
  const { addItem } = useCart();

  const attributeOptions = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const variant of variants) {
      for (const [key, value] of Object.entries(variant.attributes)) {
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)?.add(value);
      }
    }
    return Array.from(map.entries()).map(([key, values]) => ({
      key,
      values: Array.from(values),
    }));
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(
    () => variants[0]?.attributes ?? {},
  );
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentVariant =
    variants.find((v) =>
      attributeOptions.every(({ key }) => v.attributes[key] === selected[key]),
    ) ?? variants[0];

  const price = currentVariant?.priceOverride ?? basePrice;
  const outOfStock = !currentVariant || currentVariant.stockQuantity <= 0;
  const maxQuantity = currentVariant ? Math.min(currentVariant.stockQuantity, 10) : 0;

  function handleAddToCart() {
    if (!currentVariant || outOfStock) return;
    addItem(currentVariant.id, quantity);
    setFeedback("Adicionado ao carrinho!");
    setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div>
      <p className="font-display text-3xl text-rose-dark">{formatCurrency(price)}</p>

      {attributeOptions.map(({ key, values }) => (
        <div key={key} className="mt-6">
          <p className="text-sm font-medium capitalize text-plum">{key}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {values.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelected((prev) => ({ ...prev, [key]: value }));
                  setQuantity(1);
                }}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  selected[key] === value
                    ? "border-rose bg-rose-light/40 text-plum"
                    : "border-rose/30 text-plum-soft hover:border-rose"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-rose/30">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-plum-soft disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium text-plum">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-plum-soft disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {!outOfStock && currentVariant.stockQuantity <= 5 && (
          <span className="text-sm text-error">
            Só {currentVariant.stockQuantity} em estoque
          </span>
        )}
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-6 w-full"
        disabled={outOfStock}
        onClick={handleAddToCart}
      >
        {outOfStock ? "Esgotado" : "Adicionar ao carrinho"}
      </Button>

      {feedback && (
        <p className="mt-3 text-center text-sm text-success" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
