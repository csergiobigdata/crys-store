"use client";

import { useActionState } from "react";
import { confirmPixPaymentManuallyAction } from "@/lib/admin/pix-actions";

/**
 * Marca o pagamento como confirmado. O comprovante e a observação são opcionais:
 * serve tanto quando o cliente já enviou o comprovante quanto quando o administrador
 * conferiu o pagamento por fora (extrato, conversa, pagamento presencial).
 */
export function ConfirmPaymentForm({
  orderId,
  hasCustomerProof,
}: {
  orderId: string;
  hasCustomerProof: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    confirmPixPaymentManuallyAction.bind(null, orderId),
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const file = new FormData(event.currentTarget).get("proof");
        const withoutProof = !(file instanceof File && file.size > 0) && !hasCustomerProof;
        const message = withoutProof
          ? "Confirmar o pagamento SEM comprovante anexado? O cliente será avisado por e-mail."
          : "Confirmar o pagamento deste pedido? O cliente será avisado por e-mail.";
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="rounded-xl border border-success/30 bg-surface p-4"
    >
      <h3 className="text-sm font-semibold text-plum">Marcar como pagamento confirmado</h3>
      <p className="mt-1 text-xs text-plum-soft">
        {hasCustomerProof
          ? "O cliente já enviou um comprovante. Você pode anexar outro (opcional)."
          : "Anexar o comprovante é opcional: você pode confirmar sem ele."}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-plum-soft">
          Comprovante (imagem ou PDF, até 5 MB)
          <input
            type="file"
            name="proof"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="mt-1 block w-full text-sm"
          />
        </label>
        <label className="text-xs font-medium text-plum-soft">
          Observação (opcional)
          <input
            name="note"
            maxLength={300}
            placeholder="Ex.: conferido no extrato"
            className="mt-1 block w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-success px-5 py-2.5 text-sm font-medium text-blush hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Confirmando..." : "Confirmar pagamento"}
      </button>

      {state?.error && (
        <p className="mt-3 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
