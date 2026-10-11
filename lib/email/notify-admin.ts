import "server-only";
import { getEmailEnv } from "@/lib/email/env";
import { escapeHtml } from "@/lib/email/escape-html";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";

/**
 * Notificações ao admin são melhor-esforço: se o Resend falhar (ou nem
 * estiver configurado), o pedido e o upload do comprovante não devem ser
 * bloqueados por causa disso — por isso getEmailEnv() também roda dentro
 * do try/catch, não só a chamada final ao Resend.
 */
async function sendSafely(send: () => Promise<unknown>) {
  try {
    await send();
  } catch (error) {
    console.error("Falha ao enviar e-mail de notificação:", error);
  }
}

/**
 * Avisa o administrador de um pedido novo (Pix ou cartão): dados do cliente,
 * produtos, valores, entrega e forma de pagamento. Os dados vêm do banco
 * (o pedido recém-criado), nunca do formulário.
 */
export async function notifyAdminNewOrder(orderId: string) {
  await sendSafely(async () => {
    const emailEnv = getEmailEnv();
    const { data: order } = await createAdminClient()
      .from("orders")
      .select(
        "order_number, guest_name, guest_email, guest_phone, guest_cpf, shipping_address, subtotal, shipping_cost, discount_amount, total, payment_method, items:order_items(id, product_name_snapshot, variant_attributes_snapshot, unit_price, quantity, subtotal)",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const address = (order.shipping_address ?? {}) as Record<string, string>;
    const paymentLabel = order.payment_method === "pix" ? "Pix" : "Cartão de crédito";
    const items = (order.items ?? []) as {
      id: string;
      product_name_snapshot: string;
      variant_attributes_snapshot: Record<string, string> | null;
      unit_price: number;
      quantity: number;
      subtotal: number;
    }[];

    const itemRows = items
      .map((item) => {
        const attributes = Object.values(item.variant_attributes_snapshot ?? {}).join(" · ");
        return `<tr>
          <td style="padding:4px 8px">${escapeHtml(item.product_name_snapshot)}${
            attributes ? ` <span style="color:#777">(${escapeHtml(attributes)})</span>` : ""
          }</td>
          <td style="padding:4px 8px;text-align:center">${item.quantity}</td>
          <td style="padding:4px 8px;text-align:right">${formatCurrency(Number(item.unit_price))}</td>
          <td style="padding:4px 8px;text-align:right">${formatCurrency(Number(item.subtotal))}</td>
        </tr>`;
      })
      .join("");

    const discount = Number(order.discount_amount ?? 0);

    return getResendClient().emails.send({
      from: EMAIL_FROM,
      to: emailEnv.ADMIN_NOTIFICATION_EMAIL,
      subject: `Novo pedido ${order.order_number} — ${formatCurrency(Number(order.total))}`,
      html: `
        <p>Um cliente realizou uma compra na Chrys Store.</p>

        <h3 style="margin-bottom:4px">Cliente</h3>
        <p style="margin-top:0">
          <strong>Nome:</strong> ${escapeHtml(order.guest_name ?? "—")}<br/>
          <strong>E-mail:</strong> ${escapeHtml(order.guest_email ?? "—")}<br/>
          <strong>Telefone:</strong> ${escapeHtml(order.guest_phone ?? "—")}<br/>
          <strong>CPF:</strong> ${escapeHtml(order.guest_cpf ?? "—")}
        </p>

        <h3 style="margin-bottom:4px">Produtos</h3>
        <table style="border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f6e3ea">
              <th style="padding:4px 8px;text-align:left">Produto</th>
              <th style="padding:4px 8px">Qtd.</th>
              <th style="padding:4px 8px;text-align:right">Valor unit.</th>
              <th style="padding:4px 8px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <p>
          <strong>Subtotal:</strong> ${formatCurrency(Number(order.subtotal))}<br/>
          ${discount > 0 ? `<strong>Desconto:</strong> −${formatCurrency(discount)}<br/>` : ""}
          <strong>Frete${address.shipping_method_label ? ` (${escapeHtml(address.shipping_method_label)})` : ""}:</strong> ${formatCurrency(Number(order.shipping_cost))}<br/>
          <strong>Total:</strong> ${formatCurrency(Number(order.total))}<br/>
          <strong>Pagamento:</strong> ${paymentLabel}
        </p>

        <h3 style="margin-bottom:4px">Entrega</h3>
        <p style="margin-top:0">
          ${escapeHtml(address.street ?? "")}, ${escapeHtml(address.number ?? "")}${
            address.complement ? ` — ${escapeHtml(address.complement)}` : ""
          }<br/>
          ${escapeHtml(address.neighborhood ?? "")} — ${escapeHtml(address.city ?? "")}/${escapeHtml(address.state ?? "")}<br/>
          CEP ${escapeHtml(address.cep ?? "")}
        </p>

        <p><a href="${emailEnv.NEXT_PUBLIC_SITE_URL}/admin/pedidos/${encodeURIComponent(order.order_number)}">
          Abrir o pedido ${escapeHtml(order.order_number)} no painel
        </a></p>
      `,
    });
  });
}

export async function notifyAdminPixProofUploaded(params: {
  orderNumber: string;
  customerName?: string | null;
  total?: number;
  /** Comprovante já reduzido, para ir anexado ao e-mail. */
  attachment?: { filename: string; content: Buffer; contentType: string; originalSize: number };
}) {
  await sendSafely(() => {
    const emailEnv = getEmailEnv();
    const attachment = params.attachment;
    const sizeKb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

    return getResendClient().emails.send({
      from: EMAIL_FROM,
      to: emailEnv.ADMIN_NOTIFICATION_EMAIL,
      subject: `Comprovante Pix enviado — ${params.orderNumber}`,
      html: `
        <p>O cliente enviou o comprovante de pagamento do pedido
        <strong>${escapeHtml(params.orderNumber)}</strong>.</p>
        <p>
          ${params.customerName ? `<strong>Cliente:</strong> ${escapeHtml(params.customerName)}<br/>` : ""}
          ${params.total !== undefined ? `<strong>Valor do pedido:</strong> ${formatCurrency(params.total)}` : ""}
        </p>
        ${
          attachment
            ? `<p>O comprovante está <strong>anexado</strong> a este e-mail (${escapeHtml(sizeKb(attachment.content.length))}${
                attachment.content.length < attachment.originalSize
                  ? `, reduzido do original de ${escapeHtml(sizeKb(attachment.originalSize))}`
                  : ""
              }). O arquivo original fica guardado no painel.</p>`
            : ""
        }
        <p><a href="${emailEnv.NEXT_PUBLIC_SITE_URL}/admin/pedidos/${encodeURIComponent(params.orderNumber)}">
          Revisar comprovante e confirmar o pagamento
        </a></p>
      `,
      attachments: attachment
        ? [{ filename: attachment.filename, content: attachment.content }]
        : undefined,
    });
  });
}
