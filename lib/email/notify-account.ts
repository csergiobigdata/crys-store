import "server-only";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";

/**
 * E-mail de redefinição de senha, enviado pelo Resend (e não pelo e-mail
 * embutido do Supabase, que tem limite baixo e só entrega a endereços da
 * equipe do projeto). Devolve `true` se o provedor aceitou o envio.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  link: string;
}): Promise<boolean> {
  try {
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: "Redefinir sua senha — Chrys Store",
      html: `
        <p>Recebemos um pedido para redefinir a senha da sua conta na Chrys Store.</p>
        <p><a href="${params.link}">Clique aqui para criar uma nova senha</a></p>
        <p>O link vale por 1 hora e só pode ser usado uma vez. Se você não pediu isso, é só
        ignorar este e-mail: a sua senha continua a mesma.</p>
      `,
    });
    if (error) {
      console.error("Resend recusou o e-mail de redefinição de senha:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Falha ao enviar o e-mail de redefinição de senha:", error);
    return false;
  }
}
