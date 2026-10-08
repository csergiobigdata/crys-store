import "server-only";
import { Resend } from "resend";
import { getEmailEnv } from "@/lib/email/env";

let client: Resend | null = null;

export function getResendClient() {
  if (!client) {
    client = new Resend(getEmailEnv().RESEND_API_KEY);
  }
  return client;
}

// Sem domínio verificado no Resend, o remetente de teste só entrega para o
// e-mail dono da conta. Com domínio próprio, defina EMAIL_FROM no ambiente,
// ex.: "Chrys Store <pedidos@seudominio.com.br>" (sem novo deploy de código).
export const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() || "Chrys Store <onboarding@resend.dev>";
