"use client";

import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";
import { createCardPayment } from "@/lib/mercadopago/create-payment";

let mpInitialized = false;

type SubmitFormData = {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  installments: number;
};

export function CardPaymentPanel({
  orderNumber,
  token,
  amount,
  maxInstallments,
  publicKey,
}: {
  orderNumber: string;
  token: string;
  amount: number;
  maxInstallments: number;
  publicKey: string;
}) {
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!mpInitialized) {
      initMercadoPago(publicKey, { locale: "pt-BR" });
      mpInitialized = true;
    }
  }, [publicKey]);

  async function handleSubmit(formData: SubmitFormData) {
    setPending(true);
    try {
      const response = await createCardPayment({
        orderNumber,
        token,
        cardToken: formData.token,
        issuerId: formData.issuer_id,
        paymentMethodId: formData.payment_method_id,
        installments: formData.installments,
      });
      setResult(response);
      if (response.status !== "approved") {
        setAttempt((a) => a + 1);
      }
    } finally {
      setPending(false);
    }
  }

  if (result?.status === "approved") {
    return (
      <p className="rounded-lg bg-success-light px-4 py-3 text-sm text-success" role="status">
        {result.message}
      </p>
    );
  }

  return (
    <div>
      {result && (
        <p className="mb-4 rounded-lg bg-error-light px-4 py-3 text-sm text-error" role="alert">
          {result.message}
        </p>
      )}
      {pending && (
        <p className="mb-2 text-sm text-plum-soft">Processando pagamento...</p>
      )}

      <Payment
        key={attempt}
        locale="pt-BR"
        initialization={{ amount }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            maxInstallments,
          },
        }}
        onSubmit={async ({ formData }) => {
          await handleSubmit(formData as SubmitFormData);
        }}
        onError={(error) => {
          console.error("Erro no Payment Brick:", error);
        }}
      />
    </div>
  );
}
