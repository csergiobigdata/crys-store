"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { LocalDeliveryNotice } from "@/components/checkout/local-delivery-notice";
import { Button } from "@/components/ui/button";
import type { CheckoutPrefill } from "@/lib/auth/checkout-prefill";
import { getCartDetails } from "@/lib/cart/actions";
import type { CartLineDetails } from "@/lib/cart/types";
import { createOrder, getCepQuote } from "@/lib/orders/actions";
import { previewCoupon } from "@/lib/orders/coupon-actions";
import { MAX_COUPON_CODE_LENGTH } from "@/lib/orders/coupon-rules";
import type { ShippingOption } from "@/lib/orders/shipping";
import { formatCurrency } from "@/lib/utils/format";

function maskCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function CheckoutForm({
  prefill,
  isLoggedIn,
  cardEnabled,
}: {
  prefill: CheckoutPrefill | null;
  isLoggedIn: boolean;
  cardEnabled: boolean;
}) {
  const { lines, hydrated } = useCart();
  const [details, setDetails] = useState<CartLineDetails[]>([]);
  const [cep, setCep] = useState(prefill?.address.cep ?? "");
  const [address, setAddress] = useState({
    street: prefill?.address.street ?? "",
    neighborhood: prefill?.address.neighborhood ?? "",
    city: prefill?.address.city ?? "",
    state: prefill?.address.state ?? "",
  });
  const [quote, setQuote] = useState<{
    digits: string;
    units: number;
    cartKey: string;
    options: ShippingOption[];
    error: string | null;
  } | null>(null);
  const [chosenMethod, setChosenMethod] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    capped: boolean;
  } | null>(null);
  const [state, formAction, pending] = useActionState(createOrder, undefined);
  // Endereço já salvo do cliente: não deve ser sobrescrito pela consulta
  // enquanto o CEP continuar sendo o mesmo.
  const savedCep = useRef(
    prefill?.address.street ? prefill.address.cep.replace(/\D/g, "") : null,
  );

  useEffect(() => {
    if (!hydrated) return;
    getCartDetails(lines).then(setDetails);
  }, [hydrated, lines]);

  const cepDigits = cep.replace(/\D/g, "");
  const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);
  // Assinatura do carrinho: refaz a cotação se trocar um item por outro (um deles pode ser produto de teste).
  const cartKey = lines
    .map((line) => line.variantId)
    .sort()
    .join(",");

  // Consulta endereço + frete assim que o CEP tem 8 dígitos. A consulta roda
  // no servidor (a CSP do navegador não permite chamar o ViaCEP direto).
  useEffect(() => {
    if (cepDigits.length !== 8 || totalUnits === 0) return;

    let cancelled = false;
    getCepQuote(
      cepDigits,
      totalUnits,
      cartKey ? cartKey.split(",") : [],
    )
      .then((result) => {
        if (cancelled) return;
        setQuote({
          digits: cepDigits,
          units: totalUnits,
          cartKey,
          options: result?.options ?? [],
          error: result?.addressError ?? null,
        });
        if (result?.address && savedCep.current !== cepDigits) {
          setAddress(result.address);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setQuote({
          digits: cepDigits,
          units: totalUnits,
          cartKey,
          options: [],
          error: "Não foi possível consultar o CEP agora. Tente novamente.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [cepDigits, totalUnits, cartKey]);

  // Só vale a cotação do CEP que está digitado agora.
  const currentQuote =
    quote?.digits === cepDigits && quote.units === totalUnits && quote.cartKey === cartKey
      ? quote
      : null;
  const shippingOptions = currentQuote?.options ?? [];
  // Sem escolha válida do cliente, o padrão é o PAC (Envio Normal).
  const selectedOption =
    shippingOptions.find((option) => option.id === chosenMethod) ??
    shippingOptions.find((option) => option.id === "pac") ??
    shippingOptions[0] ??
    null;
  const shippingCost = selectedOption?.price ?? null;
  const cepLookupError = currentQuote?.error ?? null;
  const cepLoading = cepDigits.length === 8 && !currentQuote;

  const subtotal = details.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  // O desconto só vale enquanto o campo ainda tem o código que foi aplicado.
  const couponDiscount =
    appliedCoupon && appliedCoupon.code === couponInput.trim().toUpperCase()
      ? appliedCoupon.discount
      : 0;
  const total = shippingCost !== null ? subtotal - couponDiscount + shippingCost : null;

  async function requestCoupon(code: string) {
    const cpfField = document.getElementById("cpf") as HTMLInputElement | null;
    const emailField = document.getElementById("email") as HTMLInputElement | null;
    return previewCoupon({
      code,
      items: lines,
      cpf: cpfField?.value,
      email: emailField?.value,
    });
  }

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Digite o código do cupom.");
      return;
    }
    setCouponChecking(true);
    setCouponError(null);
    try {
      const result = await requestCoupon(code);
      if (result.ok) {
        setAppliedCoupon({ code: result.code, discount: result.discount, capped: result.capped });
        setCouponInput(result.code);
      } else {
        setAppliedCoupon(null);
        setCouponError(result.message);
      }
    } catch {
      setCouponError("Não foi possível validar o cupom agora. Tente novamente.");
    } finally {
      setCouponChecking(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput("");
  }

  if (hydrated && details.length === 0) {
    return (
      <p className="text-plum-soft">
        Seu carrinho está vazio. Volte ao catálogo para escolher seus produtos.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      <div className="space-y-8">
        <section>
          <h2 className="font-display text-xl text-plum">Seus dados</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" htmlFor="fullName" className="sm:col-span-2">
              <input
                id="fullName"
                name="fullName"
                required
                defaultValue={prefill?.fullName ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="CPF" htmlFor="cpf">
              <input
                id="cpf"
                name="cpf"
                required
                inputMode="numeric"
                placeholder="000.000.000-00"
                defaultValue={prefill?.cpf ?? ""}
                className={inputClass}
              />
              {!isLoggedIn && (
                <p className="mt-1 text-xs text-plum-soft">
                  Necessário para gerar o pagamento (Pix/cartão).
                </p>
              )}
            </Field>
            <Field label="Telefone" htmlFor="phone">
              <input
                id="phone"
                name="phone"
                required
                inputMode="tel"
                placeholder="(00) 00000-0000"
                defaultValue={prefill?.phone ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="E-mail" htmlFor="email" className="sm:col-span-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={prefill?.email ?? ""}
                readOnly={isLoggedIn}
                className={`${inputClass} ${isLoggedIn ? "bg-rose-light/40" : ""}`}
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-plum">Endereço de entrega</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="CEP" htmlFor="cep">
              <input
                id="cep"
                name="cep"
                required
                placeholder="00000-000"
                value={cep}
                inputMode="numeric"
                autoComplete="postal-code"
                onChange={(e) => setCep(maskCep(e.target.value))}
                className={inputClass}
              />
              {cepLoading && (
                <p className="mt-1 text-xs text-plum-soft">Buscando endereço e frete…</p>
              )}
              {cepLookupError && <p className="mt-1 text-xs text-error">{cepLookupError}</p>}
            </Field>
            <Field label="Número" htmlFor="number">
              <input
                id="number"
                name="number"
                required
                defaultValue={prefill?.address.number ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Rua" htmlFor="street" className="sm:col-span-2">
              <input
                id="street"
                name="street"
                required
                value={address.street}
                onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Complemento (opcional)" htmlFor="complement">
              <input
                id="complement"
                name="complement"
                defaultValue={prefill?.address.complement ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Bairro" htmlFor="neighborhood">
              <input
                id="neighborhood"
                name="neighborhood"
                required
                value={address.neighborhood}
                onChange={(e) => setAddress((a) => ({ ...a, neighborhood: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Cidade" htmlFor="city">
              <input
                id="city"
                name="city"
                required
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="UF" htmlFor="state">
              <input
                id="state"
                name="state"
                required
                maxLength={2}
                value={address.state}
                onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value.toUpperCase() }))}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-plum">Opções de envio</h2>
          <p className="mt-1 text-sm text-plum-soft">
            Enviamos de Atibaia-SP. O frete é calculado para a cidade e o
            estado do endereço informado.
          </p>
          {shippingOptions.length === 0 ? (
            <p className="mt-4 rounded-lg bg-sky-light px-4 py-3 text-sm text-sky-dark">
              {cepLoading ? "Calculando o frete…" : "Informe o CEP para ver as opções de envio."}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {shippingOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-sm transition-colors ${
                    selectedOption?.id === option.id
                      ? "border-rose bg-rose-light/40"
                      : "border-rose-light bg-white hover:border-rose/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={option.id}
                    checked={selectedOption?.id === option.id}
                    onChange={() => setChosenMethod(option.id)}
                    className="mt-1"
                  />
                  <span className="flex-1">
                    <span className="block font-medium text-plum">{option.label}</span>
                    <span className="block text-xs text-plum-soft">{option.description}</span>
                    <span className="mt-1 block text-xs text-plum-soft">
                      Prazo: {option.deadline}
                    </span>
                  </span>
                  <span className="font-semibold text-rose-dark">
                    {formatCurrency(option.price)}
                  </span>
                </label>
              ))}
              {selectedOption?.id === "local_arranged" && <LocalDeliveryNotice />}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl text-plum">Cupom (opcional)</h2>
          <div className="mt-4 flex max-w-sm gap-2">
            <input
              name="couponCode"
              value={couponInput}
              maxLength={MAX_COUPON_CODE_LENGTH}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Código do cupom"
              onChange={(event) => {
                setCouponInput(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
                setCouponError(null);
              }}
              onKeyDown={(event) => {
                // Enter aplica o cupom em vez de enviar o pedido.
                if (event.key === "Enter") {
                  event.preventDefault();
                  void applyCoupon();
                }
              }}
              className={`${inputClass} mt-0 flex-1 uppercase`}
            />
            {appliedCoupon && appliedCoupon.code === couponInput ? (
              <button
                type="button"
                onClick={removeCoupon}
                className="rounded-full border border-rose/40 px-4 py-2 text-sm font-medium text-plum hover:bg-rose-light/40"
              >
                Remover
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void applyCoupon()}
                disabled={couponChecking || couponInput.trim() === ""}
                className="rounded-full bg-rose px-5 py-2 text-sm font-medium text-white hover:bg-rose-dark disabled:opacity-50"
              >
                {couponChecking ? "Validando..." : "Aplicar"}
              </button>
            )}
          </div>
          {couponError && (
            <p className="mt-2 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
              {couponError}
            </p>
          )}
          {appliedCoupon && appliedCoupon.code === couponInput && (
            <p className="mt-2 rounded-lg bg-success-light px-3 py-2 text-sm text-success" role="status">
              Cupom {appliedCoupon.code} aplicado: desconto de {formatCurrency(appliedCoupon.discount)}
              {appliedCoupon.capped ? " (limitado a 30% do valor dos produtos)" : ""}.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl text-plum">Forma de pagamento</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 rounded-lg border border-rose/30 p-4 text-sm">
              <input type="radio" name="paymentMethod" value="pix" defaultChecked />
              Pix — QR Code gerado na hora, confirmação em até 24h
            </label>
            {cardEnabled ? (
              <label className="flex items-center gap-3 rounded-lg border border-rose/30 p-4 text-sm">
                <input type="radio" name="paymentMethod" value="cartao" />
                Cartão de crédito — em até 6x, processado pelo Mercado Pago
              </label>
            ) : (
              <div
                aria-disabled="true"
                className="flex items-start gap-3 rounded-lg border border-dashed border-rose/30 bg-rose-light/20 p-4 text-sm text-plum-soft"
              >
                <input type="radio" disabled className="mt-1" aria-label="Cartão de crédito (em breve)" />
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    Cartão de crédito — em até 6x
                    <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-white">
                      Em breve
                    </span>
                  </span>
                  <span className="mt-1 block text-xs">
                    O parcelamento no cartão ainda não está liberado, mas em breve você poderá
                    comprar assim. Por enquanto, finalize a compra pelo Pix.
                  </span>
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="h-fit rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-xl text-plum">Resumo do pedido</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-plum-soft">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-success">
              <span>Desconto (cupom {appliedCoupon?.code})</span>
              <span>-{formatCurrency(couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between gap-3 text-plum-soft">
            <span>
              Frete{address.city && shippingCost !== null ? ` (${address.city}/${address.state})` : ""}
            </span>
            <span className="flex-shrink-0">
              {shippingCost !== null ? formatCurrency(shippingCost) : "Informe o CEP"}
            </span>
          </div>
          {selectedOption && (
            <div className="rounded-lg bg-rose-light/40 px-3 py-2 text-xs text-plum">
              <p className="font-medium">{selectedOption.label}</p>
              <p className="mt-0.5 text-plum-soft">Prazo: {selectedOption.deadline}</p>
            </div>
          )}
          <div className="flex justify-between border-t border-rose-light pt-2 font-semibold text-plum">
            <span>Total</span>
            <span>{total !== null ? formatCurrency(total) : "—"}</span>
          </div>
        </div>

        {selectedOption?.id === "local_arranged" && (
          <LocalDeliveryNotice compact className="mt-4" />
        )}

        {state?.error && (
          <p className="mt-4 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="mt-6 w-full">
          {pending ? "Finalizando..." : "Finalizar pedido"}
        </Button>
        <p className="mt-3 text-center text-xs text-plum-soft">
          O valor final é sempre recalculado no servidor antes da cobrança.
        </p>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-plum">
        {label}
      </label>
      {children}
    </div>
  );
}
