"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ButtonLink } from "@/components/ui/button";
import { getCartDetails } from "@/lib/cart/actions";
import { type CartLineDetails, MAX_QUANTITY_PER_ITEM } from "@/lib/cart/types";
import { formatCurrency } from "@/lib/utils/format";

export function CartView() {
  const { lines, hydrated, setQuantity, removeItem } = useCart();
  const [catalog, setCatalog] = useState<CartLineDetails[]>([]);
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  // Nome, preço, foto e estoque só mudam quando entra ou sai um item: mudar a
  // quantidade NÃO precisa ir ao servidor. A assinatura abaixo muda só com o
  // conjunto de itens.
  const itemsKey = useMemo(
    () => lines.map((line) => line.variantId).sort().join(","),
    [lines],
  );

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    getCartDetails(itemsKey ? itemsKey.split(",").map((variantId) => ({ variantId, quantity: 1 })) : []).then(
      (result) => {
        if (!cancelled) {
          setCatalog(result);
          setDetailsLoaded(true);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [hydrated, itemsKey]);

  // A quantidade exibida vem do carrinho local: +/- responde na hora.
  const details = useMemo(() => {
    const quantityById = new Map(lines.map((line) => [line.variantId, line.quantity]));
    return catalog
      .filter((item) => quantityById.has(item.variantId))
      .map((item) => ({ ...item, quantity: quantityById.get(item.variantId) ?? item.quantity }));
  }, [catalog, lines]);

  if (!hydrated || !detailsLoaded) {
    return <p className="py-16 text-center text-plum-soft">Carregando carrinho...</p>;
  }

  if (details.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-plum-soft">Seu carrinho está vazio.</p>
        <ButtonLink href="/catalogo" className="mt-6 inline-flex">
          Ver catálogo
        </ButtonLink>
      </div>
    );
  }

  const subtotal = details.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-rose-light">
        {details.map((item) => (
          <li key={item.variantId} className="flex gap-4 py-6">
            <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-rose-light/40">
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/produto/${item.productSlug}`}
                    className="font-medium text-plum hover:text-rose-dark"
                  >
                    {item.productName}
                  </Link>
                  {Object.entries(item.variantAttributes).length > 0 && (
                    <p className="text-sm text-plum-soft">
                      {Object.entries(item.variantAttributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                  {!item.active && (
                    <p className="text-sm text-error">Este item não está mais disponível.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  aria-label="Remover item"
                  className="text-plum-soft hover:text-error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <QuantityStepper
                  quantity={item.quantity}
                  max={Math.max(1, Math.min(item.stockQuantity, MAX_QUANTITY_PER_ITEM))}
                  onChange={(next) => setQuantity(item.variantId, next)}
                />
                <p className="font-medium text-plum">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
              {item.quantity > item.stockQuantity && (
                <p className="mt-2 text-sm text-error">
                  {item.stockQuantity > 0
                    ? `Só há ${item.stockQuantity} em estoque. Ajuste a quantidade para continuar.`
                    : "Item sem estoque no momento."}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="h-fit rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-xl text-plum">Resumo</h2>
        <div className="mt-4 flex justify-between text-sm text-plum-soft">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-plum-soft">
          Frete e descontos são calculados no próximo passo.
        </p>
        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
          Ir para o checkout
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * Quantidade do item: botões − e + (respondem na hora) e campo para digitar o
 * valor direto — evita clicar dezenas de vezes para mudar de 63 para 5.
 */
function QuantityStepper({
  quantity,
  max,
  onChange,
}: {
  quantity: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (!Number.isFinite(parsed)) return;
    onChange(Math.min(Math.max(parsed, 1), max));
  }

  return (
    <div className="flex items-center rounded-full border border-rose/30">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="flex h-8 w-8 items-center justify-center text-plum-soft disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantidade"
        value={draft ?? String(quantity)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 2))}
        onFocus={(event) => event.target.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
        className="w-10 bg-transparent text-center text-sm font-medium text-plum outline-none"
      />
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
        className="flex h-8 w-8 items-center justify-center text-plum-soft disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
