import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CancelOrderForm } from "@/components/admin/orders/cancel-order-form";
import { markOrderShippedAction } from "@/lib/admin/order-actions";
import { refundCardPaymentAction } from "@/lib/admin/mercadopago-actions";
import { confirmPixPaymentAction, rejectPixPaymentAction } from "@/lib/admin/pix-actions";
import { orderStatusLabels } from "@/lib/orders/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCep, formatCurrency, formatDateTimeSeconds } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Detalhe do pedido — Admin" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*), pix_payment:pix_payments(*), shipment:shipments(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  const address = order.shipping_address as Record<string, string>;
  const pixPayment = order.pix_payment as {
    id: string;
    proof_file_path: string | null;
    review_status: string;
  } | null;

  // mercadopago_payments não tem nenhuma policy de RLS (nem para admin) —
  // só a service role lê, por design (docs/arquitetura.md, seção 5).
  const admin = createAdminClient();
  const { data: cardPaymentsData } = order.payment_method === "cartao"
    ? await admin
        .from("mercadopago_payments")
        .select("id, mp_payment_id, status, status_detail, installments, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
    : { data: null };
  const cardPayments = cardPaymentsData ?? [];

  let proofUrl: string | null = null;
  if (pixPayment?.proof_file_path) {
    const { data: signed } = await admin.storage
      .from("payment-proofs")
      .createSignedUrl(pixPayment.proof_file_path, 60 * 10);
    proofUrl = signed?.signedUrl ?? null;
  }

  const shipment = order.shipment as {
    tracking_code: string | null;
    carrier: string | null;
  } | null;

  const canReview =
    order.payment_method === "pix" &&
    ["aguardando_pagamento", "em_analise"].includes(order.status);

  const canCancel = [
    "criado",
    "aguardando_pagamento",
    "em_analise",
    "pago",
    "em_separacao",
    "pagamento_recusado",
  ].includes(order.status);

  const canMarkShipped = order.status === "pago" || order.status === "em_separacao";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-plum">
          Pedido {order.order_number}
        </h1>
        <span className="rounded-full bg-rose-light/60 px-4 py-1.5 text-sm font-medium text-plum">
          {orderStatusLabels[order.status] ?? order.status}
        </span>
      </div>

      <section className="mt-8 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Cliente</h2>
        <p className="mt-2 text-sm text-plum-soft">
          {order.guest_name} — {order.guest_email} — {order.guest_phone}
          <br />
          CPF: {order.guest_cpf}
        </p>
        <p className="mt-2 text-sm text-plum-soft">
          {address.street}, {address.number} — {address.neighborhood},{" "}
          {address.city}/{address.state} — CEP {formatCep(address.cep)}
        </p>
        {address.shipping_method_label && (
          <p className="mt-1 text-sm text-plum-soft">
            Envio: <strong>{address.shipping_method_label}</strong>
            {address.shipping_deadline ? ` — prazo: ${address.shipping_deadline}` : ""}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Itens</h2>
        <ul className="mt-3 divide-y divide-rose-light text-sm">
          {order.items.map((item: (typeof order.items)[number]) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.product_name_snapshot} × {item.quantity}
              </span>
              <span>{formatCurrency(Number(item.subtotal))}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right font-semibold text-plum">
          Total: {formatCurrency(Number(order.total))}
        </p>
      </section>

      {order.payment_method === "pix" && pixPayment && (
        <section className="mt-6 rounded-2xl border border-rose/30 bg-rose-light/20 p-6">
          <h2 className="font-display text-lg text-plum">Pagamento Pix</h2>
          <p className="mt-2 text-sm text-plum-soft">
            Status do comprovante:{" "}
            <strong>{pixPayment.review_status}</strong>
          </p>

          {proofUrl ? (
            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-medium text-rose-dark hover:underline"
            >
              Abrir comprovante enviado →
            </a>
          ) : (
            <p className="mt-3 text-sm text-plum-soft">
              O cliente ainda não enviou comprovante.
            </p>
          )}

          {canReview && (
            <div className="mt-6 flex flex-wrap gap-3">
              <form
                action={async () => {
                  "use server";
                  await confirmPixPaymentAction(order.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-full bg-success px-5 py-2.5 text-sm font-medium text-blush hover:opacity-90"
                >
                  Confirmar pagamento
                </button>
              </form>

              <form
                action={async (formData: FormData) => {
                  "use server";
                  await rejectPixPaymentAction(order.id, formData);
                }}
                className="flex flex-1 gap-2"
              >
                <input
                  name="note"
                  placeholder="Motivo da recusa (opcional)"
                  className="flex-1 rounded-lg border border-rose/30 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full border border-error px-5 py-2.5 text-sm font-medium text-error hover:bg-error-light"
                >
                  Recusar
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {order.payment_method === "cartao" && (
        <section className="mt-6 rounded-2xl border border-rose/30 bg-rose-light/20 p-6">
          <h2 className="font-display text-lg text-plum">Pagamento com cartão</h2>

          {cardPayments.length === 0 ? (
            <p className="mt-2 text-sm text-plum-soft">
              Nenhuma tentativa de pagamento registrada ainda.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {cardPayments.map((payment) => (
                <li key={payment.id} className="rounded-lg bg-surface px-3 py-2">
                  <p className="text-plum">
                    Status: <strong>{payment.status}</strong>
                    {payment.status_detail ? ` (${payment.status_detail})` : ""} —{" "}
                    {payment.installments}x
                  </p>
                  <p className="text-xs text-plum-soft">
                    ID Mercado Pago: {payment.mp_payment_id ?? "—"} ·{" "}
                    {new Date(payment.created_at).toLocaleString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {order.status === "pago" && (
            <form
              action={async () => {
                "use server";
                await refundCardPaymentAction(order.id);
              }}
              className="mt-6"
            >
              <button
                type="submit"
                className="rounded-full border border-error px-5 py-2.5 text-sm font-medium text-error hover:bg-error-light"
              >
                Estornar pagamento
              </button>
            </form>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Envio</h2>

        {shipment?.tracking_code ? (
          <p className="mt-2 text-sm text-plum-soft">
            Código de rastreio: <strong>{shipment.tracking_code}</strong>
            {shipment.carrier ? ` — ${shipment.carrier}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-plum-soft">Ainda não enviado.</p>
        )}

        {canMarkShipped && (
          <form
            action={async (formData: FormData) => {
              "use server";
              await markOrderShippedAction(order.id, formData);
            }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <input
              name="trackingCode"
              placeholder="Código de rastreio"
              required
              className="flex-1 rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
            <input
              name="carrier"
              placeholder="Transportadora (opcional)"
              className="flex-1 rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-rose px-5 py-2.5 text-sm font-medium text-plum hover:bg-rose-dark"
            >
              Marcar como enviado
            </button>
          </form>
        )}
      </section>

      {canCancel && (
        <section className="mt-6 rounded-2xl border border-error/30 bg-error-light/40 p-6">
          <h2 className="font-display text-lg text-plum">Cancelar pedido</h2>
          <p className="mt-2 text-sm text-plum-soft">
            Libera o estoque reservado e marca o pedido como cancelado. O seu nome, a
            data e a hora ficam registrados. Essa ação não pode ser desfeita.
          </p>
          <CancelOrderForm
            orderId={order.id}
            orderNumber={order.order_number}
            alreadyPaid={["pago", "em_separacao"].includes(order.status)}
          />
        </section>
      )}

      {order.status === "cancelado" && order.cancelled_at && (
        <section className="mt-6 rounded-2xl border border-error/30 bg-error-light/40 p-6">
          <h2 className="font-display text-lg text-plum">Pedido cancelado</h2>
          <dl className="mt-3 space-y-1 text-sm text-plum-soft">
            <div className="flex gap-2">
              <dt className="font-medium text-plum">Cancelado por:</dt>
              <dd>{order.cancelled_by_name ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-plum">Data e hora:</dt>
              <dd>{formatDateTimeSeconds(order.cancelled_at)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-plum">Justificativa:</dt>
              <dd>{order.cancellation_reason ?? "—"}</dd>
            </div>
            {order.cancellation_note && (
              <div className="flex gap-2">
                <dt className="font-medium text-plum">Observação:</dt>
                <dd>{order.cancellation_note}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
