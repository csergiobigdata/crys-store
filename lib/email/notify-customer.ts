import "server-only";
import { getEmailEnv } from "@/lib/email/env";
import { escapeHtml } from "@/lib/email/escape-html";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";
import { formatCurrency } from "@/lib/utils/format";

/**
 * Envolve TODA a função de notificação (não só a chamada final ao Resend)
 * — se RESEND_API_KEY/NEXT_PUBLIC_SITE_URL não estiverem configuradas, a
 * validação em getEmailEnv() também lança erro, e isso não pode derrubar
 * a criação do pedido. E-mail é melhor-esforço, não parte crítica do fluxo.
 */
async function sendSafely(send: () => Promise<unknown>) {
  try {
    await send();
  } catch (error) {
    console.error("Falha ao enviar e-mail ao cliente:", error);
  }
}

function buildOrderUrl(orderNumber: string, accessToken: string): string {
  const base = getEmailEnv().NEXT_PUBLIC_SITE_URL;
  return `${base}/pedidos/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(accessToken)}`;
}

export async function sendOrderCreatedEmail(params: {
  to: string;
  orderNumber: string;
  accessToken: string;
  total: number;
}) {
  await sendSafely(() => {
    const orderUrl = buildOrderUrl(params.orderNumber, params.accessToken);
    return getResendClient().emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Pedido recebido — ${params.orderNumber}`,
      html: `
        <p>Recebemos seu pedido na Chrys Store!</p>
        <p>
          <strong>Pedido:</strong> ${escapeHtml(params.orderNumber)}<br/>
          <strong>Total:</strong> ${formatCurrency(params.total)}
        </p>
        <p>O seu pedido só será despachado para entrega depois da confirmação do pagamento.</p>
        <p><a href="${orderUrl}">Acompanhar pedido e ver instruções de pagamento</a></p>
      `,
    });
  });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  orderNumber: string;
  accessToken: string;
  trackingCode: string;
  carrier: string | null;
}) {
  await sendSafely(() => {
    const orderUrl = buildOrderUrl(params.orderNumber, params.accessToken);
    return getResendClient().emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Pedido enviado — ${params.orderNumber}`,
      html: `
        <p>Seu pedido <strong>${escapeHtml(params.orderNumber)}</strong> foi enviado!</p>
        <p>
          <strong>Código de rastreio:</strong> ${escapeHtml(params.trackingCode)}
          ${params.carrier ? `<br/><strong>Transportadora:</strong> ${escapeHtml(params.carrier)}` : ""}
        </p>
        <p><a href="${orderUrl}">Acompanhar pedido</a></p>
      `,
    });
  });
}

export async function sendPaymentConfirmedEmail(params: {
  to: string;
  orderNumber: string;
  accessToken: string;
}) {
  await sendSafely(() => {
    const orderUrl = buildOrderUrl(params.orderNumber, params.accessToken);
    return getResendClient().emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Pagamento confirmado — ${params.orderNumber}`,
      html: `
        <p>Seu pagamento foi confirmado! Já estamos preparando seu pedido
        <strong>${escapeHtml(params.orderNumber)}</strong>.</p>
        <p><a href="${orderUrl}">Acompanhar pedido</a></p>
      `,
    });
  });
}

/**
 * Lembrete de pagamento pendente (enviado no dia seguinte ao pedido). Ao
 * contrário dos demais e-mails, devolve `false` se o envio falhar, para o
 * chamador poder tentar de novo na próxima varredura.
 */
export async function sendPaymentReminderEmail(params: {
  to: string;
  orderNumber: string;
  accessToken: string;
  total: number;
  paymentMethod: "pix" | "cartao";
  pixExpiresAt: string | null;
}): Promise<boolean> {
  try {
    const orderUrl = buildOrderUrl(params.orderNumber, params.accessToken);
    const pixDeadline =
      params.paymentMethod === "pix" && params.pixExpiresAt
        ? `<p>O código Pix deste pedido vale até
           <strong>${new Date(params.pixExpiresAt).toLocaleString("pt-BR", {
             timeZone: "America/Sao_Paulo",
             dateStyle: "short",
             timeStyle: "short",
           })}</strong>.</p>`
        : "";

    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Falta pouco! Pagamento pendente — ${params.orderNumber}`,
      html: `
        <p>Olá! Seu pedido na Chrys Store ainda está <strong>aguardando pagamento</strong>.</p>
        <p>
          <strong>Pedido:</strong> ${escapeHtml(params.orderNumber)}<br/>
          <strong>Total:</strong> ${formatCurrency(params.total)}
        </p>
        <p><strong>Importante:</strong> o seu pedido só será despachado para
        entrega depois da confirmação do pagamento.</p>
        ${pixDeadline}
        <p><a href="${orderUrl}">Ver pedido e concluir o pagamento</a></p>
        <p style="color:#7a5568;font-size:13px">Se você já pagou, pode desconsiderar
        esta mensagem — a confirmação pode levar um pouco para aparecer.</p>
      `,
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.error("Falha ao enviar lembrete de pagamento:", error);
    return false;
  }
}
