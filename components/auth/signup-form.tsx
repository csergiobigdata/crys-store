"use client";

import { useActionState } from "react";
import { signup } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  if (state?.confirmEmail) {
    return (
      <div
        role="status"
        className="rounded-3xl border border-rose-light bg-white p-6 text-plum shadow-card"
      >
        <h2 className="font-display text-xl font-semibold text-rose-dark">
          Confirme seu e-mail para ativar a conta
        </h2>
        <p className="mt-3 text-sm text-plum-soft">
          Enviamos uma mensagem para <strong>{state.confirmEmail}</strong> com
          um link de confirmação. Clique nele para ativar o cadastro.
        </p>
        <p className="mt-3 text-sm text-plum-soft">
          Enquanto o e-mail não for confirmado, a conta não é considerada válida
          e você não consegue entrar nem comprar como usuário cadastrado. Não
          achou a mensagem? Veja a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-plum">
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className="mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-plum">
          E-mail
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

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-plum">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose"
        />
        <p className="mt-1 text-xs text-plum-soft">
          Ao menos 8 caracteres, com letras e números.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-plum"
        >
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <p className="rounded-lg bg-sky-light px-3 py-2 text-xs text-sky-dark">
        Depois de criar a conta, enviaremos um e-mail de confirmação. É preciso
        clicar no link para ativar o cadastro.
      </p>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
