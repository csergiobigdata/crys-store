import "server-only";
import { escapeHtml } from "@/lib/email/escape-html";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";

export type ContactEmailResult = {
  /** Administradores para quem o e-mail foi aceito pelo provedor. */
  sent: string[];
  /** Descrição das falhas (um item por destinatário que não recebeu). */
  failures: string[];
};

/**
 * Envia a mensagem do "Fale Conosco" para cada administrador, UM E-MAIL POR
 * DESTINATÁRIO. Assim, se o provedor recusar um endereço (por exemplo, o Resend
 * em modo de teste só aceita o e-mail dono da conta), os demais ainda recebem.
 * O e-mail de quem escreveu vai em "responder para": basta clicar em Responder.
 */
export async function sendContactMessageEmail(params: {
  to: string[];
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<ContactEmailResult> {
  const result: ContactEmailResult = { sent: [], failures: [] };

  if (params.to.length === 0) {
    result.failures.push("Nenhum administrador com e-mail cadastrado.");
    return result;
  }

  const html = `
    <p>Nova mensagem pelo <strong>Fale Conosco</strong> da Chrys Store.</p>
    <p>
      <strong>Nome:</strong> ${escapeHtml(params.name)}<br/>
      <strong>E-mail:</strong> ${escapeHtml(params.email)}<br/>
      ${params.phone ? `<strong>Telefone:</strong> ${escapeHtml(params.phone)}<br/>` : ""}
    </p>
    <p style="white-space:pre-wrap">${escapeHtml(params.message)}</p>
    <p style="color:#777;font-size:12px">Para responder, basta responder a este e-mail.</p>
  `;

  let client: ReturnType<typeof getResendClient>;
  try {
    client = getResendClient();
  } catch (error) {
    console.error("Resend não configurado para o Fale Conosco:", error);
    result.failures.push(
      `Serviço de e-mail não configurado (${error instanceof Error ? error.message : "erro"}).`,
    );
    return result;
  }

  for (const recipient of params.to) {
    try {
      const { error } = await client.emails.send({
        from: EMAIL_FROM,
        to: recipient,
        replyTo: params.email,
        subject: `Fale Conosco — ${params.name}`,
        html,
      });
      if (error) {
        console.error(`Resend recusou o Fale Conosco para ${recipient}:`, error);
        result.failures.push(`${recipient}: ${error.message}`);
      } else {
        result.sent.push(recipient);
      }
    } catch (error) {
      console.error(`Falha ao enviar o Fale Conosco para ${recipient}:`, error);
      result.failures.push(
        `${recipient}: ${error instanceof Error ? error.message : "falha no envio"}`,
      );
    }
  }

  return result;
}
