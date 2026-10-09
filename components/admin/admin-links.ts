/** Opções do painel administrativo (menu "Painel Admin" do usuário admin). */
export const adminLinks = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/mensagens", label: "Mensagens" },
  { href: "/admin/administradores", label: "Administradores", primaryOnly: true },
  { href: "/admin/configuracoes", label: "Configurações" },
  { href: "/admin/auditoria", label: "Auditoria" },
];

export function isAdminLinkActive(href: string, pathname: string): boolean {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}
