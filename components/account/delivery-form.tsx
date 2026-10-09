"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CheckoutPrefill } from "@/lib/auth/checkout-prefill";
import { saveDeliveryDataAction } from "@/lib/auth/delivery-actions";
import { getCepQuote } from "@/lib/orders/actions";

function maskCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose focus:ring-2 focus:ring-rose-light";

export function DeliveryForm({ prefill }: { prefill: CheckoutPrefill }) {
  const [state, formAction, pending] = useActionState(saveDeliveryDataAction, undefined);
  const [cep, setCep] = useState(prefill.address.cep);
  const [address, setAddress] = useState({
    street: prefill.address.street,
    neighborhood: prefill.address.neighborhood,
    city: prefill.address.city,
    state: prefill.address.state,
  });
  const [quote, setQuote] = useState<{ digits: string; error: string | null } | null>(null);

  const cepDigits = cep.replace(/\D/g, "");
  const savedCep = prefill.address.street ? prefill.address.cep.replace(/\D/g, "") : null;

  useEffect(() => {
    if (cepDigits.length !== 8) return;
    let cancelled = false;
    getCepQuote(cepDigits, 1, [])
      .then((result) => {
        if (cancelled) return;
        setQuote({ digits: cepDigits, error: result?.addressError ?? null });
        if (result?.address && savedCep !== cepDigits) setAddress(result.address);
      })
      .catch(() => {
        if (!cancelled) {
          setQuote({
            digits: cepDigits,
            error: "Não foi possível consultar o CEP agora. Preencha manualmente.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cepDigits, savedCep]);

  const currentQuote = quote?.digits === cepDigits ? quote : null;

  return (
    <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field label="CPF" htmlFor="cpf">
        <input
          id="cpf"
          name="cpf"
          required
          inputMode="numeric"
          placeholder="000.000.000-00"
          defaultValue={prefill.cpf}
          className={inputClass}
        />
      </Field>
      <Field label="Telefone" htmlFor="phone">
        <input
          id="phone"
          name="phone"
          required
          inputMode="tel"
          placeholder="(00) 00000-0000"
          defaultValue={prefill.phone}
          className={inputClass}
        />
      </Field>

      <Field label="CEP" htmlFor="cep">
        <input
          id="cep"
          name="cep"
          required
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(maskCep(e.target.value))}
          className={inputClass}
        />
        {cepDigits.length === 8 && !currentQuote && (
          <p className="mt-1 text-xs text-plum-soft">Buscando endereço…</p>
        )}
        {currentQuote?.error && (
          <p className="mt-1 text-xs text-error">{currentQuote.error}</p>
        )}
      </Field>
      <Field label="Número" htmlFor="number">
        <input
          id="number"
          name="number"
          required
          defaultValue={prefill.address.number}
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
          defaultValue={prefill.address.complement}
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

      {state?.error && (
        <p
          className="rounded-lg bg-error-light px-3 py-2 text-sm text-error sm:col-span-2"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p
          className="rounded-lg bg-success-light px-3 py-2 text-sm text-success sm:col-span-2"
          role="status"
        >
          Dados salvos! Eles já vêm preenchidos no seu próximo checkout.
        </p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar dados de entrega"}
        </Button>
      </div>
    </form>
  );
}

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
