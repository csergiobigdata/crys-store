"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateLocalDeliveryAction } from "@/lib/admin/settings-actions";
import type { ActionState } from "@/lib/admin/product-actions";
import { MAX_LOCAL_FEE, MAX_LOCAL_TIERS } from "@/lib/orders/local-delivery";

type Config = {
  originCep: string;
  originLat: number;
  originLng: number;
  tiers: { upToKm: number; fee: number }[];
  motoboyFee: number;
};

const inputClass = "mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm";

export function LocalDeliveryForm({ config }: { config: Config }) {
  const [saved, setSaved] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await updateLocalDeliveryAction(previous, formData);
      setSaved(!result);
      return result;
    },
    undefined,
  );

  const sortedTiers = [...config.tiers].sort((a, b) => a.upToKm - b.upToKm);

  return (
    <form action={formAction} className="mt-5 space-y-5" onChange={() => setSaved(false)}>
      <div>
        <h3 className="text-sm font-semibold text-plum">Origem das entregas locais (a loja)</h3>
        <p className="mt-1 text-xs text-plum-soft">
          A distância até o cliente é medida em linha reta (raio) a partir deste ponto. Deixe a
          latitude e a longitude em branco para localizar o CEP automaticamente ao salvar.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-plum-soft">CEP da loja</label>
            <input
              name="originCep"
              required
              defaultValue={config.originCep}
              inputMode="numeric"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-plum-soft">Latitude</label>
            <input
              name="originLat"
              defaultValue={config.originLat}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-plum-soft">Longitude</label>
            <input
              name="originLng"
              defaultValue={config.originLng}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-plum">
          Taxa da entrega local por distância (mesma cidade)
        </h3>
        <p className="mt-1 text-xs text-plum-soft">
          Cada faixa vale até o raio informado e cobra a taxa definida por você, de R$ 0,00
          (grátis) até R$ {MAX_LOCAL_FEE.toFixed(2).replace(".", ",")}. Exemplo: até 10 km = R$
          0,00; até 20 km = R$ 35,00. Destinos além da última faixa não recebem esta opção (o
          cliente ainda pode escolher o motoboy). Até {MAX_LOCAL_TIERS} faixas; deixe em branco as
          que não usar.
        </p>
        <div className="mt-3 space-y-2">
          {Array.from({ length: MAX_LOCAL_TIERS }, (_, index) => {
            const tier = sortedTiers[index];
            return (
              <div key={index} className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2">
                <span className="text-xs text-plum-soft">Até</span>
                <input
                  name={`tierKm_${index}`}
                  defaultValue={tier?.upToKm ?? ""}
                  inputMode="decimal"
                  placeholder="km"
                  aria-label={`Faixa ${index + 1}: raio em km`}
                  className="w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
                />
                <span className="text-xs text-plum-soft">km — taxa R$</span>
                <input
                  name={`tierFee_${index}`}
                  defaultValue={tier?.fee ?? ""}
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-label={`Faixa ${index + 1}: taxa em reais`}
                  className="w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-plum">Entrega por motoboy</h3>
        <p className="mt-1 text-xs text-plum-soft">
          Valor padrão cobrado quando a entrega é feita por um motoboy contratado (você conhece o
          preço do serviço em Atibaia). Máximo de R${" "}
          {MAX_LOCAL_FEE.toFixed(2).replace(".", ",")}.
        </p>
        <div className="mt-3 max-w-xs">
          <label className="block text-xs text-plum-soft">Valor padrão (R$)</label>
          <input
            name="motoboyFee"
            required
            defaultValue={config.motoboyFee}
            inputMode="decimal"
            className={inputClass}
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
      {saved && !state?.error && (
        <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success" role="status">
          Entrega local salva!
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar entrega local"}
      </Button>
    </form>
  );
}
