import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Criar conta
      </h1>
      <p className="mt-2 text-sm text-plum-soft">
        Crie sua conta para acompanhar pedidos e ter seus dados de entrega salvos.
        Você receberá um e-mail para confirmar o cadastro. Também é possível
        comprar como convidado, sem cadastro.
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-8 text-center text-sm text-plum-soft">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-rose-dark hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
