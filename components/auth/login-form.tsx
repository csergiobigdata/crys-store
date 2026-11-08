"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { forgetLoginEmail, login } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export function LoginForm({ redirectTo, lastEmail = "" }: { redirectTo?: string; lastEmail?: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);
  // E-mail lembrado deste navegador (nunca a senha); "usar outro e-mail" o apaga.
  const [remembered, setRemembered] = useState(lastEmail);

  return (
    <form action={formAction} className="space-y-5">
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-plum">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          key={remembered}
          defaultValue={remembered}
          required
          autoComplete="email"
          className="mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose"
        />
        {remembered && (
          <p className="mt-1.5 text-xs text-plum-soft">
            Último acesso neste aparelho.{" "}
            <button
              type="button"
              onClick={() => {
                setRemembered("");
                void forgetLoginEmail();
              }}
              className="font-medium text-rose-dark hover:underline"
            >
              Usar outro e-mail
            </button>
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-plum">
          Senha
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
          autoFocus={Boolean(lastEmail)}
        />
        <p className="mt-2 text-right text-sm">
          <Link href="/esqueci-senha" className="font-medium text-rose-dark hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
