import { cn } from "@/lib/utils/cn";

const PINK = "#f27aa6";
const PINK_DARK = "#e0457f";
const PURPLE = "#6b2c82";

/**
 * Marca da Chrys Store: sacola de compras rosa com uma órbita (roxa atrás,
 * rosa-escura na frente). O texto "CHRYS STORE / DESDE 2026" é HTML, não parte
 * do SVG. `tone="light"` é a versão branca para fundos rosa (rodapé).
 */
export function LogoMark({
  className,
  tone = "color",
}: {
  className?: string;
  tone?: "color" | "light";
}) {
  const light = tone === "light";
  const bag = light ? "#ffffff" : PINK;
  const handle = light ? "#ffffff" : PURPLE;
  const orbitBack = light ? "#ffffff" : PURPLE;
  const orbitFront = light ? "#ffd3e4" : PINK_DARK;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Chrys Store"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* órbita — parte de trás (atrás da sacola) */}
      <path
        d="M5 62 A45 13 0 0 1 95 62"
        transform="rotate(-18 50 62)"
        fill="none"
        stroke={orbitBack}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* alças */}
      <path
        d="M37 40 V27 a13 13 0 0 1 26 0 V40"
        fill="none"
        stroke={handle}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M44 40 V28 a6 6 0 0 1 12 0 V40"
        fill="none"
        stroke={handle}
        strokeWidth="3"
        strokeLinecap="round"
        opacity={light ? 0.7 : 0.85}
      />
      {/* corpo da sacola */}
      <path
        d="M27 39 H73 L79 90 H21 Z"
        fill={bag}
        stroke={bag}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* órbita — parte da frente (passa por cima da sacola) */}
      <path
        d="M5 62 A45 13 0 0 0 95 62"
        transform="rotate(-18 50 62)"
        fill="none"
        stroke={orbitFront}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  tone = "color",
}: {
  className?: string;
  tone?: "color" | "light";
}) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark tone={tone} className="h-12 w-12 flex-shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.15rem] font-bold uppercase tracking-[0.16em]",
            light ? "text-white" : "text-[#e0457f]",
          )}
        >
          Chrys Store
        </span>
        <span
          className={cn(
            "mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.34em]",
            light ? "text-white/85" : "text-[#6b2c82]",
          )}
        >
          Desde 2026
        </span>
      </span>
    </span>
  );
}
