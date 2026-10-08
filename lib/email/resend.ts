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

// [REVISAR] domínio real verificado no Resend antes de ir para produção.
export const EMAIL_FROM = "Chrys Store <pedidos@chrysstore.com.br>";
