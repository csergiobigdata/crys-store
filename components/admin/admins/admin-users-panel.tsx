"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  addAdminAction,
  makePrimaryAdminAction,
  removeAdminAction,
  type AdminUsersState,
} from "@/lib/admin/admin-users-actions";

export type AdminRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
};

export function AdminUsersPanel({
  admins,
  maxAdmins,
}: {
  admins: AdminRow[];
  maxAdmins: number;
}) {
  const router = useRouter();
  const [addState, addAction, adding] = useActionState(addAdminAction, undefined);
  const [rowMessage, setRowMessage] = useState<AdminUsersState>(undefined);
  const [pending, startTransition] = useTransition();
  const full = admins.length >= maxAdmins;

  function run(action: () => Promise<AdminUsersState>, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      setRowMessage(await action());
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <ul className="divide-y divide-rose-light rounded-2xl border border-rose-light bg-surface shadow-card">
        {admins.map((admin) => (
          <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium text-plum">
                {admin.name}
                {admin.isPrimary && (
                  <span className="ml-2 rounded-full bg-rose-light px-2 py-0.5 text-[11px] font-semibold text-rose-dark">
                    Principal
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-plum-soft">
                {admin.email ?? "—"}
                {admin.phone ? ` · ${admin.phone}` : " · telefone não informado"}
              </p>
            </div>
            {!admin.isPrimary && (
              <div className="flex items-center gap-4 text-sm font-medium">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => makePrimaryAdminAction(admin.id),
                      `Tornar ${admin.name} o administrador principal? O contato dele passa a aparecer no site e você deixa de gerenciar os administradores.`,
                    )
                  }
                  className="text-rose-dark hover:underline disabled:opacity-50"
                >
                  Tornar principal
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => removeAdminAction(admin.id),
                      `Remover ${admin.name} dos administradores? Ele continua com a conta de cliente.`,
                    )
                  }
                  className="text-error hover:underline disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {rowMessage?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {rowMessage.error}
        </p>
      )}
      {rowMessage?.success && (
        <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success" role="status">
          {rowMessage.success}
        </p>
      )}

      <section className="rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-plum">Adicionar administrador</h2>
        {full ? (
          <p className="mt-2 text-sm text-plum-soft">
            Você chegou ao limite de {maxAdmins} administradores. Remova um para adicionar outro.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-plum-soft">
              A pessoa precisa ter uma conta criada e confirmada no site. Informe o e-mail dela
              para torná-la administradora.
            </p>
            <form action={addAction} className="mt-4 flex flex-wrap gap-2">
              <input
                name="email"
                type="email"
                required
                placeholder="email@exemplo.com"
                className="min-w-0 flex-1 rounded-lg border border-rose/30 px-3 py-2 text-sm"
              />
              <Button type="submit" disabled={adding}>
                {adding ? "Adicionando..." : "Adicionar"}
              </Button>
            </form>
            {addState?.error && (
              <p className="mt-3 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
                {addState.error}
              </p>
            )}
            {addState?.success && (
              <p className="mt-3 rounded-lg bg-success-light px-3 py-2 text-sm text-success" role="status">
                {addState.success}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
