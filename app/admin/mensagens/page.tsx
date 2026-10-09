import type { Metadata } from "next";
import { deleteMessageAction, setMessageReadAction } from "@/lib/admin/contact-message-actions";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Mensagens — Admin" };

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  emailed_to: string[] | null;
  email_error: string | null;
  read_at: string | null;
  created_at: string;
};

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, message, emailed_to, email_error, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const messages = (data ?? []) as Message[];
  const unread = messages.filter((message) => !message.read_at).length;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-plum">Mensagens</h1>
      <p className="mt-2 text-sm text-plum-soft">
        Mensagens enviadas pelo Fale Conosco. Elas também chegam por e-mail a todos os
        administradores; aqui ficam guardadas mesmo que o e-mail não tenha sido entregue.{" "}
        {unread > 0 ? `${unread} não lida(s).` : "Nenhuma mensagem nova."}
      </p>

      <div className="mt-6 space-y-4">
        {messages.length === 0 && (
          <p className="rounded-2xl border border-rose-light bg-surface p-6 text-center text-plum-soft">
            Nenhuma mensagem recebida ainda.
          </p>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`rounded-2xl border bg-surface p-5 shadow-card ${
              message.read_at ? "border-rose-light" : "border-rose"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-plum">
                  {message.name}
                  {!message.read_at && (
                    <span className="ml-2 rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-white">
                      Nova
                    </span>
                  )}
                </p>
                <p className="text-sm text-plum-soft">
                  <a href={`mailto:${message.email}`} className="text-rose-dark hover:underline">
                    {message.email}
                  </a>
                  {message.phone ? ` · ${message.phone}` : ""}
                </p>
              </div>
              <p className="text-xs text-plum-soft">{formatDateTime(message.created_at)}</p>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-plum">{message.message}</p>

            {message.email_error && (
              <p className="mt-3 rounded-lg bg-error-light px-3 py-2 text-xs text-error">
                O e-mail aos administradores não foi entregue ({message.email_error}). A mensagem
                está salva aqui.
              </p>
            )}

            <div className="mt-4 flex items-center gap-4 text-sm font-medium">
              <form action={setMessageReadAction.bind(null, message.id, !message.read_at)}>
                <button type="submit" className="text-rose-dark hover:underline">
                  {message.read_at ? "Marcar como não lida" : "Marcar como lida"}
                </button>
              </form>
              <form action={deleteMessageAction.bind(null, message.id)}>
                <button type="submit" className="text-error hover:underline">
                  Excluir
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
