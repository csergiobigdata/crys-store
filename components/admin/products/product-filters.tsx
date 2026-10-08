"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Category = { id: string; name: string };

const fieldClass =
  "rounded-xl border border-rose/30 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-rose focus:ring-2 focus:ring-rose-light";

/**
 * Filtros da lista de produtos do admin. O nome filtra enquanto se digita
 * (com um pequeno atraso para não consultar a cada tecla); categoria e status
 * filtram ao escolher. Tudo vai para a URL (?q=&categoria=&status=), então o
 * filtro sobrevive a recarregar a página e a lista continua sendo renderizada
 * no servidor. Qualquer mudança de filtro volta para a página 1.
 */
export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") ?? "";
  // Texto digitado (null = ainda vale o da URL). Não é ressincronizado com a URL
  // enquanto se digita, para a lista não "comer" espaços ou apagar o que foi escrito.
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? urlQuery;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function applyParams(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("pagina");
    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  function onQueryChange(value: string) {
    setTyped(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => applyParams({ q: value.trim() }), 250);
  }

  const hasFilters = Boolean(urlQuery || searchParams.get("categoria") || searchParams.get("status"));

  return (
    <div
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-light bg-surface p-4 shadow-card sm:flex-row sm:items-end"
      role="search"
    >
      <div className="flex-1">
        <label htmlFor="product-search" className="block text-xs font-medium text-plum-soft">
          Buscar produto pelo nome
        </label>
        <div className="relative mt-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-soft"
            aria-hidden="true"
          />
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Digite o nome… a lista filtra enquanto você digita"
            autoComplete="off"
            className={`${fieldClass} w-full pl-9`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="product-category" className="block text-xs font-medium text-plum-soft">
          Categoria
        </label>
        <select
          id="product-category"
          value={searchParams.get("categoria") ?? ""}
          onChange={(event) => applyParams({ categoria: event.target.value })}
          className={`${fieldClass} mt-1 w-full sm:w-56`}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="product-status" className="block text-xs font-medium text-plum-soft">
          Status
        </label>
        <select
          id="product-status"
          value={searchParams.get("status") ?? ""}
          onChange={(event) => applyParams({ status: event.target.value })}
          className={`${fieldClass} mt-1 w-full sm:w-44`}
        >
          <option value="">Todos</option>
          <option value="A">A — Ativos</option>
          <option value="I">I — Inativos</option>
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setTyped(null);
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
          className="flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-dark hover:bg-rose-light/50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Limpar
        </button>
      )}

      <span className="sr-only" aria-live="polite">
        {pending ? "Atualizando a lista…" : ""}
      </span>
    </div>
  );
}
