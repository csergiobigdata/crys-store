import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { ProductFilters } from "@/components/admin/products/product-filters";
import { ButtonLink } from "@/components/ui/button";
import { deleteProductAction } from "@/lib/admin/product-actions";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Produtos — Admin" };

const PAGE_SIZE = 20;

type SearchParams = { q?: string; categoria?: string; status?: string; pagina?: string };

/** Monta o link de uma página mantendo os filtros ativos. */
function pageHref(filters: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/admin/produtos?${query}` : "/admin/produtos";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const status = filters.status === "A" || filters.status === "I" ? filters.status : "";
  const page = Math.max(1, Number.parseInt(filters.pagina ?? "1", 10) || 1);

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, slug, base_price, status, inactivated_at, category:categories(name)", {
      count: "exact",
    })
    .order("name");

  // % e _ são curingas do ILIKE: escapa para buscar o texto digitado de verdade.
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  if (filters.categoria) query = query.eq("category_id", filters.categoria);
  if (status) query = query.eq("status", status);

  const from = (page - 1) * PAGE_SIZE;
  const [{ data, count }, { data: categories }] = await Promise.all([
    query.range(from, from + PAGE_SIZE - 1),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const products = (data ?? []) as unknown as {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    status: "A" | "I";
    inactivated_at: string | null;
    category: { name: string } | null;
  }[];

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2,
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-plum">
          Produtos
        </h1>
        <ButtonLink href="/admin/produtos/novo">Novo produto</ButtonLink>
      </div>

      <ProductFilters categories={categories ?? []} />

      <p className="mt-4 text-sm text-plum-soft" aria-live="polite">
        {total === 0
          ? "Nenhum produto encontrado."
          : `${total} produto${total === 1 ? "" : "s"} — mostrando ${from + 1} a ${from + products.length}`}
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-rose-light bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rose-light text-plum-soft">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Preço base</th>
              <th className="p-4">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-light">
            {products.map((product) => (
              <tr
                key={product.id}
                className="relative transition-colors hover:bg-rose-light/30"
              >
                <td className="p-4 font-medium text-plum">
                  {/* O link se estende por toda a linha (after:inset-0): clicar em qualquer
                      ponto dela abre o cadastro do produto. Editar/Excluir ficam acima (z-10). */}
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="after:absolute after:inset-0 hover:text-rose-dark hover:underline"
                    title="Abrir o cadastro deste produto"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="p-4 text-plum-soft">
                  {product.category?.name ?? "—"}
                </td>
                <td className="p-4 text-plum-soft">
                  {formatCurrency(Number(product.base_price))}
                </td>
                <td className="p-4">
                  <span
                    className={
                      product.status === "A"
                        ? "rounded-full bg-success-light px-3 py-1 text-xs font-medium text-success"
                        : "rounded-full bg-rose-light/60 px-3 py-1 text-xs font-medium text-plum-soft"
                    }
                  >
                    {product.status === "A" ? "A · Ativo" : "I · Inativo"}
                  </span>
                  {product.status === "I" && product.inactivated_at && (
                    <p className="mt-1 text-xs text-plum-soft">
                      desde {new Date(product.inactivated_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </td>
                <td className="p-4">
                  <div className="relative z-10 flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="text-sm font-medium text-rose-dark hover:underline"
                    >
                      Editar
                    </Link>
                    <ConfirmActionButton
                      label="Excluir"
                      title={`Excluir "${product.name}"?`}
                      description="Se este produto já tiver vendas, ele não será apagado: ficará Inativo (I) com a data de inativação registrada. Sem vendas, será removido definitivamente."
                      action={deleteProductAction.bind(null, product.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="p-6 text-center text-plum-soft">
            {q || filters.categoria || status
              ? "Nenhum produto corresponde aos filtros."
              : "Nenhum produto cadastrado ainda."}
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={pageHref(filters, page - 1)}
              className="rounded-full border border-rose-light bg-white px-4 py-2 text-sm font-medium text-rose-dark hover:border-rose"
            >
              ← Anterior
            </Link>
          )}
          {pageNumbers.map((n, index) => (
            <span key={n} className="flex items-center gap-2">
              {index > 0 && n - pageNumbers[index - 1] > 1 && (
                <span className="text-plum-soft">…</span>
              )}
              <Link
                href={pageHref(filters, n)}
                aria-current={n === page ? "page" : undefined}
                className={
                  n === page
                    ? "rounded-full bg-gradient-to-br from-[#6b2c82] to-[#c22a6b] px-4 py-2 text-sm font-semibold text-white shadow-card"
                    : "rounded-full border border-rose-light bg-white px-4 py-2 text-sm font-medium text-plum hover:border-rose"
                }
              >
                {n}
              </Link>
            </span>
          ))}
          {page < totalPages && (
            <Link
              href={pageHref(filters, page + 1)}
              className="rounded-full border border-rose-light bg-white px-4 py-2 text-sm font-medium text-rose-dark hover:border-rose"
            >
              Próxima →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
