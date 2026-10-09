"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveProfileAction } from "@/lib/auth/profile-actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose focus:ring-2 focus:ring-rose-light";

export function ProfileForm({
  fullName,
  nickname,
  phone,
  isAdmin = false,
}: {
  fullName: string | null;
  nickname: string | null;
  phone: string | null;
  isAdmin?: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveProfileAction, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label htmlFor="profile-fullName" className="block text-sm font-medium text-plum">
          Nome completo
        </label>
        <input
          id="profile-fullName"
          name="fullName"
          required
          defaultValue={fullName ?? ""}
          autoComplete="name"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="profile-nickname" className="block text-sm font-medium text-plum">
          Como você gostaria de ser chamado(a)? (apelido)
        </label>
        <input
          id="profile-nickname"
          name="nickname"
          maxLength={30}
          defaultValue={nickname ?? ""}
          placeholder="Ex.: Chrys"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-plum-soft">
          Aparece no menu da sua conta. Deixe em branco para usar o seu primeiro nome.
        </p>
      </div>

      <div>
        <label htmlFor="profile-phone" className="block text-sm font-medium text-plum">
          Telefone de contato (com DDD)
        </label>
        <input
          id="profile-phone"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={phone ?? ""}
          placeholder="(11) 98765-4321"
          className={inputClass}
        />
        {isAdmin && (
          <p className="mt-1 text-xs text-plum-soft">
            Se você for o administrador principal, este telefone e o seu e-mail aparecem no
            rodapé e na janela &ldquo;Sobre&rdquo; do site.
          </p>
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success" role="status">
          Dados salvos!
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
