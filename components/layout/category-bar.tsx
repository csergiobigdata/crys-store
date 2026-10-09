"use client";

import { Flower2, Gem, Gift, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { COMPACT_CATEGORY_BAR_THRESHOLD } from "@/lib/admin/category-limit";
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

  // Com mais de 3 categorias os botões ficam compactos (só ícone e nome), em
  // linhas que quebram, para a faixa do topo não ocupar a tela inteira.
  const compact = categories.length > COMPACT_CATEGORY_BAR_THRESHOLD;

  return (
    <nav
      aria-label="Categorias"
      className={cn(
        "px-4 pb-3 pt-3 sm:px-6 lg:px-8",
        compact
          ? "flex flex-wrap justify-center gap-2"
          : "flex gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:overflow-visible",
      )}
      style={
        compact
          ? undefined
          : { gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }
      }
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
              "group relative flex items-center overflow-hidden transition-all duration-200",
              compact
                ? "gap-2 rounded-full px-3 py-1.5"
                : "min-w-[15rem] flex-1 gap-3 rounded-2xl px-4 py-2.5 sm:min-w-0",
              style.tile,
              isActive
                ? cn(
                    "-translate-y-0.5 shadow-card-hover",
                    compact ? "ring-2" : "scale-[1.02] ring-4",
                    style.glow,
                  )
                : "shadow-card hover:-translate-y-0.5 hover:shadow-card-hover",
              hasSelection && !isActive && "opacity-60 saturate-75 hover:opacity-100",
            )}
          >
            <span
              className={cn(
                "flex flex-shrink-0 items-center justify-center",
                compact ? "h-6 w-6 rounded-full" : "h-9 w-9 rounded-xl",
                style.iconWrap,
              )}
            >
              <Icon className={compact ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"} aria-hidden="true" />
            </span>
            {!compact && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-white/25 transition-transform duration-500 group-hover:scale-125",
                  isActive && "scale-150 bg-white/40",
                )}
              />
            )}
            <span className="relative min-w-0">
              <span
                className={cn(
                  "block truncate font-display font-semibold leading-tight",
                  compact ? "max-w-[10rem] text-sm" : "text-base",
                )}
              >
                {category.name}
              </span>
              {!compact && (
                <span className="block truncate text-xs opacity-90">
                  {decor?.description ?? "Veja os produtos"}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
