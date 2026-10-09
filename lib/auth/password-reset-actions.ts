"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendPasswordResetEmail } from "@/lib/email/notify-account";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";

export type PasswordResetState = { error?: string; sent?: boolean } | undefined;

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Passo 1: a pessoa informa o e-mail. A resposta é SEMPRE a mesma, exista ou
 * não uma conta com aquele e-mail — assim ninguém descobre quem é cliente.
 * O link é montado aqui (com o token gerado pelo Supabase) e enviado pelo Resend.
 */
export async function requestPasswordReset(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informe um e-mail válido." };
  }
  const email = parsed.data.email.trim().toLowerCase();

  const [allowedByIp, allowedByEmail] = await Promise.all([
    checkRateLimit({
      bucket: "password_reset_ip",
      identifier: await clientIp(),
      maxAttempts: 10,
      windowMinutes: 60,
    }),
    checkRateLimit({
      bucket: "password_reset_email",
      identifier: email,
      maxAttempts: 3,
      windowMinutes: 60,
    }),
  ]);
  if (!allowedByIp || !allowedByEmail) {
    return { error: "Muitos pedidos de redefinição. Aguarde um pouco e tente novamente." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl) {
    const { data, error } = await createAdminClient().auth.admin.generateLink({
      type: "recovery",
      email,
    });
    const tokenHash = data?.properties?.hashed_token;
    if (!error && tokenHash) {
      const link = `${siteUrl}/redefinir-senha?token_hash=${encodeURIComponent(tokenHash)}`;
      await sendPasswordResetEmail({ to: email, link });
    }
    // Conta inexistente (error) ou e-mail recusado: nada a informar à pessoa.
  } else {
    console.error("NEXT_PUBLIC_SITE_URL não configurada: não foi possível montar o link de senha.");
  }

  return { sent: true };
}

/**
 * Passo 2: a pessoa abre o link e escolhe a senha nova. O token só é consumido
 * AQUI (ao enviar o formulário), e não ao abrir a página — assim os "pré-visualizadores"
 * de link de e-mail não gastam o link antes da pessoa.
 */
export async function resetPassword(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = resetPasswordSchema.safeParse({
    tokenHash: formData.get("tokenHash"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados." };
  }

  const allowed = await checkRateLimit({
    bucket: "password_reset_submit",
    identifier: await clientIp(),
    maxAttempts: 10,
    windowMinutes: 60,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde um pouco e tente novamente." };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.tokenHash,
    type: "recovery",
  });
  if (verifyError) {
    return { error: "Este link é inválido ou já expirou. Peça um novo link de redefinição." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (updateError) {
    console.error("Falha ao atualizar a senha:", updateError.code, updateError.message);
    await supabase.auth.signOut();
    return {
      error:
        updateError.code === "same_password"
          ? "Escolha uma senha diferente da anterior."
          : "Não foi possível alterar a senha. Peça um novo link e tente de novo.",
    };
  }

  // Por segurança, encerra a sessão aberta pelo link: a pessoa entra com a senha nova.
  await supabase.auth.signOut();
  redirect("/entrar?senha=alterada");
}
