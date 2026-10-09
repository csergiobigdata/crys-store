"use server";

import { headers } from "next/headers";
import { sendContactMessageEmail } from "@/lib/email/notify-contact";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getAllAdminEmails } from "@/lib/site/contact";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { contactSchema } from "@/lib/validations/contact";

export type ContactFormState = { error?: string; sent?: boolean } | undefined;

/**
 * "Fale Conosco": grava a mensagem (nada se perde se o e-mail falhar) e a envia
 * por e-mail a TODOS os administradores cadastrados.
 */
export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Campo-isca escondido: pessoas não o veem nem preenchem; robôs costumam preencher.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { sent: true };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkRateLimit({
    bucket: "contact_form",
    identifier: ip,
    maxAttempts: 5,
    windowMinutes: 60,
  });
  if (!allowed) {
    return { error: "Você enviou várias mensagens seguidas. Aguarde um pouco e tente de novo." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados da mensagem." };
  }

  const user = await getCurrentUser();
  const supabase = createAdminClient();
  const { data: saved, error: saveError } = await supabase
    .from("contact_messages")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      message: parsed.data.message,
      profile_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (saveError || !saved) {
    console.error("Falha ao gravar a mensagem do Fale Conosco:", saveError?.message);
    return { error: "Não foi possível enviar a sua mensagem agora. Tente novamente em instantes." };
  }

  const recipients = await getAllAdminEmails();
  const emailError = await sendContactMessageEmail({
    to: recipients,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: parsed.data.message,
  });

  await supabase
    .from("contact_messages")
    .update({ emailed_to: emailError ? null : recipients, email_error: emailError })
    .eq("id", saved.id);

  // A mensagem está gravada e aparece no painel mesmo que o e-mail tenha falhado.
  return { sent: true };
}
