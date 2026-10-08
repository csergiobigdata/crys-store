"use client";

import { Flower2, Gem, Gift, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type BarCategory = { name: string; slug: string };

// As categorias vêm do banco (o admin cria/edita em /admin/categorias); aqui só
// decoramos as conhecidas e damos um padrão às novas.
const decorBySlug: Record<string, { icon: LucideIcon; description: string }> = {
  acessorios: { icon: Gem, description: "Pulseiras, colares, brincos e mais" },
  "casa-e-decoracao": { icon: Flower2, description: "Charme para o seu cantinho" },
  mimos: { icon: Gift, description: "Kits e lembrancinhas para presentear" },
};

const tileStyles = [
  { tile: "bg-rose text-white", iconWrap: "bg-white/25", glow: "ring-rose/40" },
  { tile: "bg-sky text-plum", iconWrap: "bg-white/50", glow: "ring-sky/60" },
  { tile: "bg-rose-light text-rose-dark", iconWrap: "bg-white/70", glow: "ring-rose/40" },
  { tile: "bg-sky-light text-sky-dark", iconWrap: "bg-white/80", glow: "ring-sky/60" },
];

/**
 * Faixa de categorias fixa no topo de todas as páginas. A categoria que está
 * sendo navegada (/catalogo?categoria=...) fica "iluminada": anel luminoso,
 * sombra e leve destaque, enquanto as demais ficam mais discretas.
 */
export function CategoryBar({ categories }: { categories: BarCategory[] }) {
  const pathname = usePathname();
  const activeSlug = useSearchParams().get("categoria");
  const selected = pathname === "/catalogo" ? activeSlug : null;
  const hasSelection = categories.some((category) => category.slug === selected);

  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categorias"
      className="flex gap-3 overflow-x-auto px-4 pb-3 pt-3 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-6 lg:px-8"
      style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, minmax(0, 1fr))` }}
    >
      {categories.map((category, index) => {
        const decor = decorBySlug[category.slug];
        const Icon = decor?.icon ?? Sparkles;
        const style = tileStyles[index % tileStyles.length];
        const isActive = category.slug === selected;

        return (
          <Link
            key={category.slug}
            href={`/catalogo?categoria=${category.slug}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex min-w-[15rem] flex-1 items-center gap-3 overflow-hidden rounded-2xl px-4 py-2.5 transition-all duration-200 sm:min-w-0",
              style.tile,
              isActive
                ? cn("-translate-y-0.5 scale-[1.02] shadow-card-hover ring-4", style.glow)
                : "shadow-card hover:-translate-y-0.5 hover:shadow-card-hover",
              hasSelection && !isActive && "opacity-60 saturate-75 hover:opacity-100",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                style.iconWrap,
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-white/25 transition-transform duration-500 group-hover:scale-125",
                isActive && "scale-150 bg-white/40",
              )}
            />
            <span className="relative min-w-0">
              <span className="block truncate font-display text-base font-semibold leading-tight">
                {category.name}
              </span>
              <span className="block truncate text-xs opacity-90">
                {decor?.description ?? "Veja os produtos"}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
