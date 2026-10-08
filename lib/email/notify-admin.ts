import "server-only";
import { getEmailEnv } from "@/lib/email/env";
import { escapeHtml } from "@/lib/email/escape-html";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";
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

export async function notifyAdminNewPixOrder(params: {
  orderNumber: string;
  total: number;
  customerName: string;
}) {
  await sendSafely(() => {
    const emailEnv = getEmailEnv();
    return getResendClient().emails.send({
      from: EMAIL_FROM,
      to: emailEnv.ADMIN_NOTIFICATION_EMAIL,
      subject: `Novo pedido Pix — ${params.orderNumber}`,
      html: `
        <p>Novo pedido aguardando pagamento via Pix.</p>
        <p>
          <strong>Pedido:</strong> ${escapeHtml(params.orderNumber)}<br/>
          <strong>Cliente:</strong> ${escapeHtml(params.customerName)}<br/>
          <strong>Valor:</strong> ${formatCurrency(params.total)}
        </p>
        <p><a href="${emailEnv.NEXT_PUBLIC_SITE_URL}/admin/pedidos">Ver pedidos no painel</a></p>
      `,
    });
  });
}

export async function notifyAdminPixProofUploaded(params: { orderNumber: string }) {
  await sendSafely(() => {
    const emailEnv = getEmailEnv();
    return getResendClient().emails.send({
      from: EMAIL_FROM,
      to: emailEnv.ADMIN_NOTIFICATION_EMAIL,
      subject: `Comprovante Pix enviado — ${params.orderNumber}`,
      html: `
        <p>O cliente enviou o comprovante de pagamento do pedido
        <strong>${escapeHtml(params.orderNumber)}</strong>.</p>
        <p><a href="${emailEnv.NEXT_PUBLIC_SITE_URL}/admin/pedidos/${encodeURIComponent(params.orderNumber)}">
          Revisar comprovante
        </a></p>
      `,
    });
  });
}
