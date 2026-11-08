import "server-only";
import { cookies } from "next/headers";

/**
 * Último e-mail que entrou com sucesso neste navegador, só para preencher o
 * campo no próximo login. A senha nunca é guardada — nem aqui, nem em lugar
 * nenhum além do Supabase Auth.
 */
export const LAST_LOGIN_COOKIE = "chrys-last-login";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getLastLoginEmail(): Promise<string> {
  const value = (await cookies()).get(LAST_LOGIN_COOKIE)?.value ?? "";
  // O cookie é só uma sugestão de preenchimento: ignora qualquer valor que não pareça um e-mail.
  return value.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(value) ? value : "";
}

export async function rememberLastLoginEmail(email: string) {
  (await cookies()).set(LAST_LOGIN_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function forgetLastLoginEmail() {
  (await cookies()).delete(LAST_LOGIN_COOKIE);
}
