import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { CardPaymentPanel } from "@/components/checkout/card-payment-panel";
import { PixPaymentPanel } from "@/components/checkout/pix-payment-panel";
import { getMpEnv } from "@/lib/mercadopago/env";
import { getMaxInstallments } from "@/lib/mercadopago/settings";
import { getOrderForViewing } from "@/lib/orders/get-order";
import { orderStatusLabels, orderStatusTone } from "@/lib/orders/status";
import { renderPixQrCode } from "@/lib/pix/qrcode";
import { cn } from "@/lib/utils/cn";
import { formatCep, formatCurrency, formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Seu pedido" };

const toneClasses: Record<string, string> = {
  neutral: "bg-rose-light/60 text-plum",
  warning: "bg-rose-light/50 text-rose-dark",
  success: "bg-success-light text-success",
  error: "bg-error-light text-error",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderNumber } = await params;
  const { token } = await searchParams;

  const order = await getOrderForViewing(orderNumber, token);
  if (!order) notFound();

  const address = order.shipping_address as Record<string, string>;
  const tone = orderStatusTone[order.status] ?? "neutral";

  const awaitingPixPayment =
    order.payment_method === "pix" &&
    ["aguardando_pagamento", "em_analise"].includes(order.status) &&
    order.pix_payment;

  const qrDataUrl = awaitingPixPayment
    ? await renderPixQrCode(order.pix_payment!.payload_emv)
    : null;

  const awaitingCardPayment =
    order.payment_method === "cartao" &&
    ["aguardando_pagamento", "pagamento_recusado"].includes(order.status);

  const maxInstallments = awaitingCardPayment ? await getMaxInstallments() : 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <ClearCartOnMount />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-plum-soft">Pedido</p>
          <h1 className="font-display text-2xl font-semibold text-plum">
            {order.order_number}
          </h1>
        </div>
        <span
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium",
            toneClasses[tone],
          )}
        >
          {orderStatusLabels[order.status] ?? order.status}
        </span>
      </div>

      <section className="mt-8 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Itens</h2>
        <ul className="mt-4 divide-y divide-rose-light">
          {order.items.map((item: (typeof order.items)[number]) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <div>
                <p className="font-medium text-plum">
                  {item.product_name_snapshot} × {item.quantity}
                </p>
                {Object.entries(item.variant_attributes_snapshot ?? {}).length > 0 && (
                  <p className="text-plum-soft">
                    {Object.entries(item.variant_attributes_snapshot as Record<string, string>)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-plum">{formatCurrency(Number(item.subtotal))}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-rose-light pt-4 text-sm">
          <div className="flex justify-between text-plum-soft">
            <span>Subtotal</span>
            <span>{formatCurrency(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-plum-soft">
            <span>Frete</span>
            <span>{formatCurrency(Number(order.shipping_cost))}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-plum-soft">
              <span>Desconto</span>
              <span>-{formatCurrency(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold text-plum">
            <span>Total</span>
            <span>{formatCurrency(Number(order.total))}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Entrega</h2>
        <p className="mt-2 text-sm text-plum-soft">
          {address.street}, {address.number}
          {address.complement ? ` — ${address.complement}` : ""}
          <br />
          {address.neighborhood} — {address.city}/{address.state}
          <br />
          CEP {formatCep(address.cep)}
        </p>
        {address.shipping_method_label && (
          <p className="mt-2 text-sm text-plum-soft">
            Envio: <strong>{address.shipping_method_label}</strong>
            {address.shipping_deadline ? ` — prazo: ${address.shipping_deadline}` : ""}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-rose/30 bg-rose-light/20 p-6">
        <h2 className="font-display text-lg text-plum">Pagamento</h2>

        {order.payment_method === "pix" && awaitingPixPayment && qrDataUrl ? (
          <PixPaymentPanel
            orderNumber={order.order_number}
            token={order.access_token}
            qrDataUrl={qrDataUrl}
            payload={order.pix_payment!.payload_emv}
            totalFormatted={formatCurrency(Number(order.total))}
            expiresAtFormatted={
              order.pix_expires_at
                ? formatDateTime(order.pix_expires_at)
                : ""
            }
            reviewStatus={order.pix_payment!.review_status}
            automatic={Boolean(order.pix_payment!.mp_payment_id)}
          />
        ) : order.payment_method === "pix" && order.status === "pago" ? (
          <p className="mt-2 text-sm text-success">
            Pagamento Pix confirmado! Já estamos preparando seu pedido.
          </p>
        ) : order.payment_method === "pix" && order.status === "expirado" ? (
          <p className="mt-2 text-sm text-error">
            O prazo para pagamento deste pedido expirou. Faça um novo pedido
            para continuar a compra.
          </p>
        ) : order.payment_method === "pix" ? (
          <p className="mt-2 text-sm text-plum-soft">
            Este pedido não está mais aguardando pagamento via Pix.
          </p>
        ) : awaitingCardPayment ? (
          <CardPaymentPanel
            orderNumber={order.order_number}
            token={order.access_token}
            amount={Number(order.total)}
            maxInstallments={maxInstallments}
            publicKey={getMpEnv().NEXT_PUBLIC_MP_PUBLIC_KEY}
          />
        ) : order.status === "pago" ? (
          <p className="mt-2 text-sm text-success">
            Pagamento aprovado! Já estamos preparando seu pedido.
          </p>
        ) : order.status === "estornado" ? (
          <p className="mt-2 text-sm text-plum-soft">
            Este pagamento foi estornado.
          </p>
        ) : order.status === "expirado" ? (
          <p className="mt-2 text-sm text-error">
            O prazo para pagamento deste pedido expirou. Faça um novo pedido
            para continuar a compra.
          </p>
        ) : (
          <p className="mt-2 text-sm text-plum-soft">
            Este pedido não está mais aguardando pagamento por cartão.
          </p>
        )}
      </section>
    </div>
  );
}
