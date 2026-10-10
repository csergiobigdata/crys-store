"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

export type AuthFormState = { error: string } | undefined;

/** `confirmEmail` preenchido = conta criada, falta confirmar o e-mail. */
export type SignupFormState = { error?: string; confirmEmail?: string } | undefined;

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe um e-mail e senha válidos." };
  }

  const ip = await clientIp();
  const [allowedByEmail, allowedByIp] = await Promise.all([
    checkRateLimit({
      bucket: "login_email",
      identifier: parsed.data.email.toLowerCase(),
      maxAttempts: 5,
      windowMinutes: 15,
    }),
    checkRateLimit({
      bucket: "login_ip",
      identifier: ip,
      maxAttempts: 20,
      windowMinutes: 15,
    }),
  ]);

  if (!allowedByEmail || !allowedByIp) {
    return {
      error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Seu e-mail ainda não foi confirmado. Abra o e-mail que enviamos no cadastro (veja também o spam) e clique no link de confirmação.",
      };
    }
    console.error("Falha no login (signInWithPassword):", error.code, error.message);
    return { error: "E-mail ou senha incorretos." };
  }

  // Depois de entrar, vai para a página inicial — ou para onde a pessoa estava indo
  // (ex.: /checkout). Só aceita caminhos do próprio site: "//" e "/\\" abririam
  // outro endereço (redirecionamento aberto).
  const redirectParam = formData.get("redirect");
  const redirectTo =
    typeof redirectParam === "string" &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//") &&
    !redirectParam.startsWith("/\\")
      ? redirectParam
      : "/";

  redirect(redirectTo);
}

export async function signup(
  _prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ip = await clientIp();
  const allowedByIp = await checkRateLimit({
    bucket: "signup_ip",
    identifier: ip,
    maxAttempts: 10,
    windowMinutes: 60,
  });

  if (!allowedByIp) {
    return { error: "Muitas tentativas de cadastro. Tente novamente mais tarde." };
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${headerList.get("x-forwarded-proto") ?? "http"}://${headerList.get("host")}`;

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      // Para onde o link do e-mail de confirmação leva (rota /auth/confirmar).
      emailRedirectTo: `${origin}/auth/confirmar`,
    },
  });

  if (error) {
    console.error("Falha no cadastro (signUp):", error.code, error.message);
    return {
      error:
        error.code === "user_already_exists"
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar sua conta. Tente novamente.",
    };
  }

  // Com "Confirm email" ligado no Supabase, o cadastro não gera sessão: a conta
  // só vale depois que o cliente clica no link enviado por e-mail.
  if (!data.session) {
    // E-mail já cadastrado: o Supabase não devolve erro (para não revelar
    // quais e-mails existem), mas a lista de identidades vem vazia.
    if (data.user && data.user.identities?.length === 0) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    return { confirmEmail: parsed.data.email };
  }

  redirect("/minha-conta");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type DeleteAccountState = { error: string } | undefined;

/**
 * Exclusão de conta a pedido do titular (LGPD, art. 18, VI). Remove o
 * usuário do Supabase Auth — profiles tem "on delete cascade", então o
 * perfil some junto; pedidos têm "on delete set null" em profile_id, então
 * o histórico de compras continua existindo (como um pedido de convidado),
 * só deixa de ficar associado a uma conta.
 */
export async function deleteAccountAction(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();
  if (confirmation !== "EXCLUIR") {
    return { error: 'Digite "EXCLUIR" para confirmar.' };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/entrar");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: "Não foi possível excluir sua conta agora. Tente novamente." };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/");
}
