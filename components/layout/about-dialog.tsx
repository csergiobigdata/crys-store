"use client";

import { Mail, Phone, X } from "lucide-react";
import { useRef } from "react";
import { LogoMark } from "@/components/ui/logo";

/**
 * Botão "Sobre" do rodapé: abre uma janela com a logomarca, o nome do
 * aplicativo, a versão e o contato do administrador principal.
 */
export function AboutDialog({
  email,
  phone,
  version,
}: {
  email: string | null;
  phone: string | null;
  version: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-left hover:text-white hover:underline"
      >
        Sobre
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="about-title"
        onClick={(event) => {
          // Clicar no fundo escuro (fora do cartão) fecha a janela.
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[min(92vw,24rem)] rounded-3xl border border-rose-light bg-white p-0 text-plum shadow-card-hover backdrop:bg-plum/50"
      >
        <div className="relative px-6 pb-6 pt-8 text-center">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-plum-soft hover:bg-rose-light/50"
          >
            <X className="h-4 w-4" />
          </button>

          <LogoMark className="mx-auto h-24 w-24" />
          <h2 id="about-title" className="mt-4 font-display text-2xl font-semibold text-rose-dark">
            Chrys Store
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-plum-soft">Desde 2026</p>
          <p className="mt-1 text-xs text-plum-soft">Versão {version}</p>

          <div className="mt-6 space-y-3 rounded-2xl bg-rose-light/30 p-4 text-left text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-plum-soft">
              Contato do administrador
            </p>
            {phone ? (
              <p className="flex items-center gap-3">
                <Phone className="h-4 w-4 flex-shrink-0 text-rose-dark" aria-hidden="true" />
                <a href={`tel:+55${phone.replace(/\D/g, "")}`} className="hover:underline">
                  {phone}
                </a>
              </p>
            ) : null}
            {email ? (
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 flex-shrink-0 text-rose-dark" aria-hidden="true" />
                <a href={`mailto:${email}`} className="break-all hover:underline">
                  {email}
                </a>
              </p>
            ) : null}
            {!phone && !email && (
              <p className="text-plum-soft">Contato ainda não informado.</p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
