"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setSalesPausedAction } from "@/lib/admin/sales-actions";

export function SalesPauseForm({ paused }: { paused: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setSalesPausedAction(next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-4">
      <p
        role="status"
        className={`rounded-lg px-3 py-2 text-sm font-medium ${
          paused ? "bg-error-light text-error" : "bg-success-light text-success"
        }`}
      >
        {paused ? "Vendas pausadas no momento." : "Vendas liberadas."}
      </p>

      <Button
        type="button"
        variant={paused ? "primary" : "outline"}
        size="sm"
        disabled={pending}
        className="mt-4"
        onClick={() => {
          if (
            paused ||
            window.confirm(
              "Pausar as vendas? Os clientes continuarão vendo os produtos, mas não conseguirão comprar até você liberar.",
            )
          ) {
            change(!paused);
          }
        }}
      >
        {pending ? "Salvando..." : paused ? "Liberar vendas" : "Pausar vendas"}
      </Button>

      {error && (
        <p className="mt-2 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
