"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadPixProof } from "@/lib/pix/upload-proof";

export function PixPaymentPanel({
  orderNumber,
  token,
  qrDataUrl,
  payload,
  totalFormatted,
  expiresAtFormatted,
  reviewStatus,
}: {
  orderNumber: string;
  token: string;
  qrDataUrl: string;
  payload: string;
  totalFormatted: string;
  expiresAtFormatted: string;
  reviewStatus: "aguardando" | "em_analise" | "confirmado" | "recusado";
}) {
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(uploadPixProof, undefined);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard indisponível — o cliente ainda pode selecionar o texto manualmente.
    }
  }

  return (
    <div>
      <p className="text-sm text-plum-soft">
        Pague <strong>{totalFormatted}</strong> via Pix até{" "}
        <strong>{expiresAtFormatted}</strong>.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 rounded-xl bg-surface p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR Code Pix do pedido" width={240} height={240} />
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar código Pix"}
        </Button>
      </div>

      <p className="mt-4 text-sm text-plum-soft">
        Após pagar, envie o comprovante abaixo. A confirmação é feita pela
        equipe da Chrys Store.
      </p>

      {reviewStatus === "em_analise" && (
        <p className="mt-2 rounded-lg bg-rose-light/40 px-3 py-2 text-sm text-plum">
          Comprovante recebido e em análise. Você pode enviar outro arquivo se
          precisar corrigir.
        </p>
      )}
      {reviewStatus === "recusado" && (
        <p className="mt-2 rounded-lg bg-error-light px-3 py-2 text-sm text-error">
          O comprovante enviado não foi aceito. Envie um novo comprovante.
        </p>
      )}

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="orderNumber" value={orderNumber} />
        <input type="hidden" name="token" value={token} />
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm text-plum-soft"
        />
        {state?.error && (
          <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success" role="status">
            Comprovante enviado com sucesso!
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar comprovante"}
        </Button>
      </form>
    </div>
  );
}
