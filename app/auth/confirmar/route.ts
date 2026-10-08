import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino do link do e-mail de confirmação de cadastro. Troca o `code` por uma
 * sessão e leva o cliente para a conta. Se a troca falhar (por exemplo, o link
 * foi aberto em outro aparelho), o e-mail já está confirmado do mesmo jeito:
 * basta entrar com e-mail e senha.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/minha-conta", request.url));
    }
  }

  return NextResponse.redirect(new URL("/entrar?confirmado=1", request.url));
}
