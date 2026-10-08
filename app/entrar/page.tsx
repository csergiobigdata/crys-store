import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; confirmado?: string }>;
}) {
  const { redirect, confirmado } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Entrar
      </h1>
      <p className="mt-2 text-sm text-plum-soft">
        Acesse sua conta para ver seus pedidos e finalizar compras mais
        rápido.
      </p>

      {confirmado && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-success-light px-3 py-2 text-sm text-success"
        >
          E-mail confirmado! Agora é só entrar com seu e-mail e senha.
        </p>
      )}

      <div className="mt-8">
        <LoginForm redirectTo={redirect} />
      </div>

      <p className="mt-8 text-center text-sm text-plum-soft">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-rose-dark hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
