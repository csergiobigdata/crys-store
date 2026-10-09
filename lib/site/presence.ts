/**
 * "Online agora": presença anônima via Supabase Realtime. Cada aba aberta do
 * site anuncia apenas uma ÁREA do site (nunca a URL, que pode ter token de
 * pedido) e se há alguém logado — sem nome, e-mail ou identificador de conta.
 */

export const PRESENCE_CHANNEL = "site-presence";

export type SiteArea =
  | "inicio"
  | "catalogo"
  | "produto"
  | "carrinho"
  | "checkout"
  | "pedido"
  | "conta"
  | "entrar"
  | "outras";

export type PresencePayload = {
  area: SiteArea;
  logged: boolean;
};

export const AREA_LABELS: Record<SiteArea, string> = {
  inicio: "Página inicial",
  catalogo: "Catálogo",
  produto: "Vendo um produto",
  carrinho: "Carrinho",
  checkout: "Checkout (finalizando a compra)",
  pedido: "Acompanhando um pedido",
  conta: "Minha conta",
  entrar: "Entrar / Cadastro",
  outras: "Outras páginas",
};

/** Ordem em que as áreas aparecem no painel (do começo ao fim da compra). */
export const AREA_ORDER: SiteArea[] = [
  "inicio",
  "catalogo",
  "produto",
  "carrinho",
  "checkout",
  "pedido",
  "conta",
  "entrar",
  "outras",
];

/** Converte o caminho da URL em uma área genérica, sem expor ids nem tokens. */
export function areaFromPath(pathname: string): SiteArea {
  if (pathname === "/") return "inicio";
  if (pathname.startsWith("/catalogo")) return "catalogo";
  if (pathname.startsWith("/produto/")) return "produto";
  if (pathname.startsWith("/carrinho")) return "carrinho";
  if (pathname.startsWith("/checkout")) return "checkout";
  if (pathname.startsWith("/pedidos/")) return "pedido";
  if (pathname.startsWith("/minha-conta")) return "conta";
  if (pathname.startsWith("/entrar") || pathname.startsWith("/cadastro")) return "entrar";
  return "outras";
}

/** O painel administrativo não entra na contagem (é a equipe, não os clientes). */
export function isTrackedPath(pathname: string): boolean {
  return !pathname.startsWith("/admin");
}

export type PresenceSummary = {
  total: number;
  logged: number;
  byArea: Partial<Record<SiteArea, number>>;
};

/** Resume o estado de presença do canal (uma entrada por aba aberta). */
export function summarizePresence(state: Record<string, PresencePayload[]>): PresenceSummary {
  const summary: PresenceSummary = { total: 0, logged: 0, byArea: {} };
  for (const entries of Object.values(state)) {
    // Cada chave é uma aba; se houver reentradas, vale a mais recente.
    const latest = entries[entries.length - 1];
    if (!latest) continue;
    summary.total += 1;
    if (latest.logged) summary.logged += 1;
    summary.byArea[latest.area] = (summary.byArea[latest.area] ?? 0) + 1;
  }
  return summary;
}
