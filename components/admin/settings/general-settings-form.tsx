"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateGeneralSettingsAction } from "@/lib/admin/settings-actions";

type CompanyInfo = {
  razao_social?: string;
  cnpj_ou_cpf?: string;
  endereco?: string;
  contato?: string;
};

export function GeneralSettingsForm({
  pixExpirationHours,
  mpMaxInstallments,
  pixConfig,
  companyInfo,
}: {
  pixExpirationHours: number;
  mpMaxInstallments: number;
  pixConfig: { key: string; merchantName: string; merchantCity: string };
  companyInfo: CompanyInfo;
}) {
  const [state, formAction, pending] = useActionState(updateGeneralSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-plum">
            Prazo de pagamento Pix (horas)
          </label>
          <input
            name="pixExpirationHours"
            type="number"
            min="1"
            required
            defaultValue={pixExpirationHours}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-plum">
            Parcelamento máximo no cartão
          </label>
          <input
            name="mpMaxInstallments"
            type="number"
            min="1"
            max="12"
            required
            defaultValue={mpMaxInstallments}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-plum">Pix da loja (recebimento)</h3>
        <p className="mt-1 text-xs text-plum-soft">
          É a chave que recebe os pagamentos: o QR Code e o &ldquo;copia e cola&rdquo;
          gerados no checkout usam estes dados. Confira com cuidado — um
          erro aqui manda o dinheiro para a conta errada.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-plum-soft">
              Chave Pix (CPF, CNPJ, e-mail, telefone com DDD ou chave aleatória)
            </label>
            <input
              name="pixKey"
              required
              autoComplete="off"
              defaultValue={pixConfig.key}
              className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-plum-soft">
              Nome do recebedor (até 25 caracteres)
            </label>
            <input
              name="pixMerchantName"
              required
              maxLength={25}
              defaultValue={pixConfig.merchantName}
              className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-plum-soft">
              Cidade do recebedor (até 15 caracteres)
            </label>
            <input
              name="pixMerchantCity"
              required
              maxLength={15}
              defaultValue={pixConfig.merchantCity}
              className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-plum">
          Dados da empresa (exibidos no rodapé do site)
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-plum-soft">Razão social</label>
            <input
              name="companyRazaoSocial"
              required
              defaultValue={companyInfo.razao_social ?? ""}
              className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-plum-soft">
              CNPJ ou CPF (deixe em branco para NÃO exibir no site)
            </label>
            <input
              name="companyCnpjOuCpf"
              defaultValue={companyInfo.cnpj_ou_cpf ?? ""}
              className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-plum-soft">
              Endereço (deixe em branco para NÃO exibir no site)
            </label>
            <input
              name="companyEndereco"
              defaultValue={companyInfo.endereco ?? ""}
              className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-plum-soft">Contato</label>
            <input
              name="companyContato"
              required
              defaultValue={companyInfo.contato ?? ""}
              className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
