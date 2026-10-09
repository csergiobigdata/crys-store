import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Criar nova senha" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash: tokenHash } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">Criar nova senha</h1>

      {tokenHash ? (
        <>
          <p className="mt-2 text-sm text-plum-soft">Escolha a nova senha da sua conta.</p>
          <div className="mt-8">
            <ResetPasswordForm tokenHash={tokenHash} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
            Link inválido. Peça um novo link de redefinição.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/esqueci-senha" className="font-medium text-rose-dark hover:underline">
              Pedir novo link
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
