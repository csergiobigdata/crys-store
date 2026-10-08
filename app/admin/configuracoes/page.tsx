import type { Metadata } from "next";
import { GeneralSettingsForm } from "@/components/admin/settings/general-settings-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configurações — Admin" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase.from("app_settings").select("key, value");

  const settingsByKey = new Map((settings ?? []).map((s) => [s.key, s.value]));

  // Chave Pix cadastrada pelo admin; se ainda não houver, sugere a do .env.
  const storedPix = settingsByKey.get("pix_config") as
    | { key?: string; merchant_name?: string; merchant_city?: string }
    | undefined;
  const pixConfig = {
    key: storedPix?.key ?? process.env.PIX_KEY ?? "",
    merchantName: storedPix?.merchant_name ?? process.env.PIX_MERCHANT_NAME ?? "",
    merchantCity: storedPix?.merchant_city ?? process.env.PIX_MERCHANT_CITY ?? "",
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Configurações
      </h1>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <GeneralSettingsForm
          pixExpirationHours={Number(settingsByKey.get("pix_expiration_hours") ?? 24)}
          mpMaxInstallments={Number(settingsByKey.get("mp_max_installments") ?? 6)}
          pixConfig={pixConfig}
          companyInfo={settingsByKey.get("company_info") ?? {}}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Frete</h2>
        <p className="mt-1 text-sm text-plum-soft">
          O frete é calculado a partir de Atibaia-SP, por zona de destino, com
          PAC, SEDEX, Mini Envios e entrega local (mesmo dia / dia seguinte).
          Os valores e prazos ficam na tabela de{" "}
          <code>lib/orders/shipping.ts</code> e são estimativas até a loja
          integrar uma cotação real dos Correios.
        </p>
      </section>
    </div>
  );
}
