import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Renova a sessão do Supabase Auth em toda navegação (Next.js 16 renomeou
 * middleware.ts -> proxy.ts, rodando sempre em runtime nodejs) e bloqueia
 * acesso sem login a /admin e /minha-conta. A verificação da role `admin`
 * em si é refeita no servidor em cada rota/Server Action — este proxy só
 * garante que existe uma sessão antes de chegar lá.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const requiresAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/minha-conta");

  if (!user && requiresAuth) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/entrar";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
