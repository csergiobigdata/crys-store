import "server-only";
import { escapeHtml } from "@/lib/email/escape-html";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";

/**
 * Envia a mensagem do "Fale Conosco" para todos os administradores. O
 * remetente da loja é o do sistema; o e-mail de quem escreveu vai em
 * "responder para", então basta clicar em Responder.
 * Devolve `null` se enviou, ou o texto do erro (a mensagem já está salva).
 */
export async function sendContactMessageEmail(params: {
  to: string[];
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<string | null> {
  if (params.to.length === 0) return "Nenhum administrador com e-mail cadastrado.";

  try {
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: params.to,
      replyTo: params.email,
      subject: `Fale Conosco — ${params.name}`,
      html: `
        <p>Nova mensagem pelo <strong>Fale Conosco</strong> da Chrys Store.</p>
        <p>
          <strong>Nome:</strong> ${escapeHtml(params.name)}<br/>
          <strong>E-mail:</strong> ${escapeHtml(params.email)}<br/>
          ${params.phone ? `<strong>Telefone:</strong> ${escapeHtml(params.phone)}<br/>` : ""}
        </p>
        <p style="white-space:pre-wrap">${escapeHtml(params.message)}</p>
        <p style="color:#777;font-size:12px">Para responder, basta responder a este e-mail.</p>
      `,
    });
    return error ? error.message : null;
  } catch (error) {
    console.error("Falha ao enviar o Fale Conosco por e-mail:", error);
    return error instanceof Error ? error.message : "Falha ao enviar o e-mail.";
  }
}
