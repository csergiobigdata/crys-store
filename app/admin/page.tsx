import type { Metadata } from "next";
import {
  BarChart3,
  FolderTree,
  History,
  Package,
  Settings2,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { OnlineNow } from "@/components/admin/online-now";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Painel administrativo" };

async function getCounts() {
  const supabase = await createClient();

  const [products, pendingPix, orders] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_method", "pix")
      .eq("status", "em_analise"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  return {
    activeProducts: products.count ?? 0,
    pendingPixReview: pendingPix.count ?? 0,
    totalOrders: orders.count ?? 0,
  };
}

const options = [
  {
    href: "/admin/produtos",
    label: "Produtos",
    description: "Cadastrar produtos, alterar fotos, descrição, preço, estoque e status (A/I).",
    icon: Package,
  },
  {
    href: "/admin/categorias",
    label: "Categorias",
    description: "Criar, renomear, ativar/desativar e excluir categorias de produtos.",
    icon: FolderTree,
  },
  {
    href: "/admin/cupons",
    label: "Cupons",
    description: "Cupons de desconto (percentual ou valor fixo), validade e limite de uso.",
    icon: Ticket,
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    description: "Acompanhar pedidos, confirmar Pix, marcar como enviado e cancelar.",
    icon: ShoppingBag,
  },
  {
    href: "/admin/relatorios",
    label: "Relatórios",
    description: "Faturamento por período e por forma de pagamento.",
    icon: BarChart3,
  },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    description: "Chave Pix da loja, parcelamento, prazo do Pix e dados da empresa.",
    icon: Settings2,
  },
  {
    href: "/admin/auditoria",
    label: "Auditoria",
    description: "Quem alterou o quê e quando (produtos, pedidos, configurações).",
    icon: History,
  },
];

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  const cards = [
    {
      label: "Produtos ativos",
      value: counts.activeProducts,
      href: "/admin/produtos",
      gradient: "from-[#5b2380] via-[#7a2e9a] to-[#a23a9b]",
    },
    {
      label: "Comprovantes Pix em análise",
      value: counts.pendingPixReview,
      href: "/admin/pedidos?status=em_analise&metodo=pix",
      highlight: counts.pendingPixReview > 0,
      gradient: "from-[#7a2e9a] via-[#b0359f] to-[#e0457f]",
    },
    {
      label: "Pedidos no total",
      value: counts.totalOrders,
      href: "/admin/pedidos",
      gradient: "from-[#4a2a8f] via-[#6b2c82] to-[#2b7fb8]",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-plum">
        Painel administrativo
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover ${card.gradient} ${
              card.highlight ? "ring-4 ring-rose/50" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/15"
            />
            <p className="relative text-sm font-medium text-white/90">{card.label}</p>
            <p className="relative mt-2 font-display text-4xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>

      <OnlineNow />

      <h2 className="mt-10 font-display text-xl font-semibold text-plum">
        Cadastros &amp; Gestão Admin.
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {options.map(({ href, label, description, icon: Icon }, index) => {
          const blue = index % 2 === 1;
          return (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-4 rounded-3xl border border-rose-light bg-surface p-5 shadow-card transition-all hover:-translate-y-1 hover:border-rose hover:shadow-card-hover"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${
                    blue ? "bg-sky-light text-sky-dark" : "bg-rose-light text-rose-dark"
                  }`}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-semibold text-plum">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-plum-soft">
                    {description}
                  </span>
                </span>
                <span className="text-sm font-medium text-rose-dark">
                  Abrir <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
