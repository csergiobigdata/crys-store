import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">Esqueci minha senha</h1>
      <p className="mt-2 text-sm text-plum-soft">
        Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-8 text-center text-sm text-plum-soft">
        Lembrou?{" "}
        <Link href="/entrar" className="font-medium text-rose-dark hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
