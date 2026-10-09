"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelOrderAction } from "@/lib/admin/order-actions";
import { CANCELLATION_REASONS } from "@/lib/orders/cancellation-reasons";

const fieldClass =
  "w-full rounded-lg border border-rose/30 bg-surface px-3 py-2 text-sm text-plum outline-none focus:border-rose focus:ring-2 focus:ring-rose-light";

/**
 * Cancelamento de pedido pelo administrador: exige uma justificativa da lista
 * e pede confirmação antes de executar. Quem cancelou e quando (data, hora e
 * segundo) é gravado no servidor — nada disso vem do navegador.
 */
export function CancelOrderForm({
  orderId,
  orderNumber,
  alreadyPaid,
}: {
  orderId: string;
  orderNumber: string;
  alreadyPaid: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function askConfirmation() {
    if (!reason) {
      setError("Selecione a justificativa do cancelamento.");
      return;
    }
    if (reason === "outro" && !note.trim()) {
      setError("Descreva o motivo do cancelamento.");
      return;
    }
    setError(null);
    dialogRef.current?.showModal();
  }

  function confirm() {
    startTransition(async () => {
      const result = await cancelOrderAction(orderId, { reason, note });
      dialogRef.current?.close();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="cancel-reason" className="block text-sm font-medium text-plum">
            Justificativa <span className="text-error">*</span>
          </label>
          <select
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={`${fieldClass} mt-1.5`}
          >
            <option value="">Selecione o motivo…</option>
            {CANCELLATION_REASONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cancel-note" className="block text-sm font-medium text-plum">
            Observação {reason === "outro" ? <span className="text-error">*</span> : "(opcional)"}
          </label>
          <textarea
            id="cancel-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={2}
            className={`${fieldClass} mt-1.5`}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={askConfirmation}
          className="rounded-full border border-error px-5 py-2.5 text-sm font-medium text-error hover:bg-error-light"
        >
          Cancelar pedido
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl border border-rose-light bg-white p-6 text-plum shadow-card-hover backdrop:bg-plum/40"
      >
        <h2 className="font-display text-xl font-semibold">Cancelar o pedido {orderNumber}?</h2>
        <p className="mt-2 text-sm text-plum-soft">
          O estoque reservado volta para a loja e o cancelamento fica registrado com o seu nome,
          a data e a hora. Essa ação não pode ser desfeita.
        </p>
        {alreadyPaid && (
          <p className="mt-3 rounded-lg bg-rose-light/50 px-3 py-2 text-sm text-plum">
            Este pedido já foi pago. O cancelamento <strong>não devolve o dinheiro</strong>{" "}
            automaticamente: faça o reembolso ao cliente (estorno no cartão ou Pix de volta).
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="!bg-error hover:!bg-error/90"
          >
            {pending ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
        </div>
      </dialog>
    </>
  );
}
