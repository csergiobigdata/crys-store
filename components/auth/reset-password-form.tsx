"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/auth/password-reset-actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose";

export function ResetPasswordForm({ tokenHash }: { tokenHash: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="tokenHash" value={tokenHash} />

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-plum">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-plum-soft">Ao menos 8 caracteres, com letras e números.</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-plum">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
