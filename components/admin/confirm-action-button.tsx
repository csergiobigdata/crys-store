"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { DeleteResult } from "@/lib/admin/product-actions";

/**
 * Botão de ação destrutiva que SEMPRE pede confirmação antes de executar
 * (exclusão de produtos e categorias). Usa o <dialog> nativo, que já cuida
 * de foco, tecla Esc e acessibilidade.
 */
export function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel = "Excluir",
  action,
  redirectOnDelete,
  size = "sm",
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  action: () => Promise<DeleteResult>;
  /** Para onde ir quando o registro for realmente apagado. */
  redirectOnDelete?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function open() {
    setError(null);
    setNotice(null);
    dialogRef.current?.showModal();
  }

  function confirm() {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      dialogRef.current?.close();
      if (result.deleted && redirectOnDelete) {
        router.push(redirectOnDelete);
        return;
      }
      setNotice(result.notice ?? null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={
          size === "sm"
            ? "text-sm font-medium text-error hover:underline"
            : "rounded-full border-2 border-error/40 px-5 py-2 text-sm font-medium text-error hover:bg-error-light"
        }
      >
        {label}
      </button>

      {notice && (
        <p
          role="status"
          className="mt-2 rounded-lg bg-sky-light px-3 py-2 text-xs text-sky-dark"
        >
          {notice}
        </p>
      )}

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl border border-rose-light bg-white p-6 text-plum shadow-card-hover backdrop:bg-plum/40"
      >
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-plum-soft">{description}</p>

        {error && (
          <p className="mt-3 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="!bg-error hover:!bg-error/90"
          >
            {pending ? "Aguarde..." : confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
