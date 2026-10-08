"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "chrys-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Resolvido em microtask para não ser um setState síncrono dentro do
    // corpo do efeito (checagem única de localStorage no mount).
    Promise.resolve().then(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    });
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage indisponível — o aviso só não reaparece nesta sessão.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-rose-light bg-plum px-4 py-4 text-blush sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-blush/80">
          Usamos cookies essenciais para o funcionamento do carrinho e da sua
          sessão. Não usamos cookies de rastreamento ou publicidade. Saiba
          mais na nossa{" "}
          <Link href="/politica-de-privacidade" className="underline hover:text-rose-light">
            Política de Privacidade
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="flex-shrink-0 rounded-full bg-rose px-5 py-2 text-sm font-medium text-plum hover:bg-rose-dark"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
