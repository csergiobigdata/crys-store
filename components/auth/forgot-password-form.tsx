"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/auth/password-reset-actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <div
        className="rounded-2xl border border-success/40 bg-success-light/60 p-6"
        role="status"
      >
        <p className="font-display text-xl text-success">Confira o seu e-mail</p>
        <p className="mt-2 text-sm text-plum-soft">
          Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. O
          link vale por 1 hora. Não achou? Olhe também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-plum">
          E-mail da sua conta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
    </form>
  );
}
