"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CatalogFilters({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    for (const key of ["busca", "preco_min", "preco_max"]) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) params.set(key, value);
      else params.delete(key);
    }

    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 border-b border-rose-light pb-6"
    >
      <div className="min-w-[200px] flex-1">
        <label htmlFor="busca" className="block text-xs font-medium text-plum-soft">
          Buscar
        </label>
        <input
          id="busca"
          name="busca"
          defaultValue={searchParams.get("busca") ?? ""}
          placeholder="O que você procura?"
          className="mt-1 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm outline-none focus:border-rose"
        />
      </div>

      <div>
        <label htmlFor="categoria" className="block text-xs font-medium text-plum-soft">
          Categoria
        </label>
        <select
          id="categoria"
          defaultValue={searchParams.get("categoria") ?? ""}
          onChange={(e) => updateParam("categoria", e.target.value)}
          className="mt-1 rounded-lg border border-rose/30 px-3 py-2 text-sm outline-none focus:border-rose"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <div>
          <label htmlFor="preco_min" className="block text-xs font-medium text-plum-soft">
            Preço mín.
          </label>
          <input
            id="preco_min"
            name="preco_min"
            type="number"
            min={0}
            step="0.01"
            defaultValue={searchParams.get("preco_min") ?? ""}
            className="mt-1 w-24 rounded-lg border border-rose/30 px-3 py-2 text-sm outline-none focus:border-rose"
          />
        </div>
        <div>
          <label htmlFor="preco_max" className="block text-xs font-medium text-plum-soft">
            Preço máx.
          </label>
          <input
            id="preco_max"
            name="preco_max"
            type="number"
            min={0}
            step="0.01"
            defaultValue={searchParams.get("preco_max") ?? ""}
            className="mt-1 w-24 rounded-lg border border-rose/30 px-3 py-2 text-sm outline-none focus:border-rose"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ordenar" className="block text-xs font-medium text-plum-soft">
          Ordenar por
        </label>
        <select
          id="ordenar"
          defaultValue={searchParams.get("ordenar") ?? "relevancia"}
          onChange={(e) => updateParam("ordenar", e.target.value)}
          className="mt-1 rounded-lg border border-rose/30 px-3 py-2 text-sm outline-none focus:border-rose"
        >
          <option value="relevancia">Relevância</option>
          <option value="novidade">Novidades</option>
          <option value="menor_preco">Menor preço</option>
          <option value="maior_preco">Maior preço</option>
        </select>
      </div>

      <Button type="submit" variant="outline" size="sm">
        Aplicar
      </Button>
    </form>
  );
}
