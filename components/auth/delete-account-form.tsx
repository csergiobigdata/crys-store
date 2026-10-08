"use client";

import { useActionState } from "react";
import { deleteAccountAction } from "@/lib/auth/actions";

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccountAction, undefined);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="confirmation" className="block text-xs text-plum-soft">
          Digite EXCLUIR para confirmar
        </label>
        <input
          id="confirmation"
          name="confirmation"
          required
          className="mt-1 rounded-lg border border-error/30 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-error px-5 py-2.5 text-sm font-medium text-error hover:bg-error-light disabled:opacity-50"
      >
        {pending ? "Excluindo..." : "Excluir minha conta"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
