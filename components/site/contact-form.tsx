"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { sendContactMessage } from "@/lib/site/contact-actions";
import { MAX_CONTACT_MESSAGE_LENGTH } from "@/lib/validations/contact";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-rose/30 bg-surface px-4 py-2.5 text-sm text-plum outline-none focus:border-rose focus:ring-2 focus:ring-rose-light";

export function ContactForm({
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}) {
  const [state, formAction, pending] = useActionState(sendContactMessage, undefined);
  const [length, setLength] = useState(0);

  if (state?.sent) {
    return (
      <div
        className="rounded-2xl border border-success/40 bg-success-light/60 p-6 text-center"
        role="status"
      >
        <p className="font-display text-xl text-success">Mensagem enviada!</p>
        <p className="mt-2 text-sm text-plum-soft">
          Recebemos a sua mensagem e responderemos para o e-mail informado assim que possível.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Campo-isca contra robôs: fica fora da tela e ninguém o preenche. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Não preencha este campo</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-plum">
            Seu nome
          </label>
          <input
            id="contact-name"
            name="name"
            required
            defaultValue={defaultName}
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-plum">
            Seu e-mail
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            autoComplete="email"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-plum">
          Telefone (opcional)
        </label>
        <input
          id="contact-phone"
          name="phone"
          inputMode="tel"
          defaultValue={defaultPhone}
          autoComplete="tel"
          placeholder="(11) 98765-4321"
          className={`${inputClass} sm:max-w-xs`}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-plum">
          Mensagem
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={MAX_CONTACT_MESSAGE_LENGTH}
          onChange={(event) => setLength(event.target.value.length)}
          placeholder="Escreva aqui a sua dúvida, sugestão ou elogio. Se for sobre um pedido, informe o número dele."
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-plum-soft">
          {length}/{MAX_CONTACT_MESSAGE_LENGTH}
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
