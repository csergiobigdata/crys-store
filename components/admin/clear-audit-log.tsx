"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { clearAuditLogAction } from "@/lib/admin/audit-actions";

/**
 * Apagar todo o log de auditoria (só administrador principal). Abre uma janela
 * de confirmação e exige digitar APAGAR antes de executar.
 */
export function ClearAuditLog({ total }: { total: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(clearAuditLogAction, undefined);

  return (
    <section className="mt-10 rounded-2xl border border-error/30 bg-surface p-5 shadow-card">
      <h2 className="font-display text-lg font-semibold text-plum">Apagar o log de auditoria</h2>
      <p className="mt-1 text-sm text-plum-soft">
        Remove todos os registros de quem alterou o quê. A ação não pode ser desfeita. Fica gravado
        apenas um registro dizendo quem apagou o log.
      </p>

      {state?.notice && (
        <p role="status" className="mt-3 rounded-lg bg-success-light px-3 py-2 text-sm text-success">
          {state.notice}
        </p>
      )}

      <button
        type="button"
        disabled={total === 0}
        onClick={() => dialogRef.current?.showModal()}
        className="mt-4 rounded-full border-2 border-error/40 px-5 py-2 text-sm font-medium text-error hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        Apagar todo o log
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl border border-rose-light bg-white p-6 text-plum shadow-card-hover backdrop:bg-plum/40"
      >
        <form action={formAction}>
          <h3 className="font-display text-xl font-semibold">Apagar todo o log de auditoria?</h3>
          <p className="mt-2 text-sm text-plum-soft">
            Todos os registros serão excluídos de forma definitiva. Para confirmar, digite{" "}
            <strong>APAGAR</strong>.
          </p>

          <input
            name="confirmation"
            required
            autoComplete="off"
            aria-label="Digite APAGAR para confirmar"
            className="mt-4 w-full rounded-lg border border-error/30 px-3 py-2 text-sm"
          />

          {state?.error && (
            <p className="mt-3 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
              {state.error}
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
            <Button type="submit" disabled={pending} className="!bg-error hover:!bg-error/90">
              {pending ? "Apagando..." : "Apagar tudo"}
            </Button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
