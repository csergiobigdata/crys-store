"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { UserMenu } from "@/components/layout/user-menu";
import { logout } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

// As categorias ficam na barra fixa abaixo do cabeçalho (CategoryBar).
const navLinks = [{ href: "/catalogo", label: "Todos os produtos" }];

export function HeaderNav({ user }: { user: CurrentUser | null }) {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <nav className="hidden items-center gap-8 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-plum-soft transition-colors hover:text-rose-dark"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Link
            href="/entrar"
            className="hidden items-center gap-1.5 text-sm font-medium text-plum-soft transition-colors hover:text-rose-dark md:flex"
            aria-label="Entrar"
          >
            <User className="h-5 w-5" aria-hidden="true" />
            Entrar
          </Link>
        )}

        <Link
          href="/carrinho"
          className="relative flex items-center text-plum-soft transition-colors hover:text-rose-dark"
          aria-label={`Carrinho de compras${itemCount > 0 ? `, ${itemCount} item(ns)` : ""}`}
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose px-1 text-[10px] font-semibold text-white">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          className="flex items-center text-plum-soft md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute left-0 top-full w-full overflow-hidden border-b border-rose-light bg-blush md:hidden",
            )}
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-plum-soft hover:bg-rose-light/50 hover:text-rose-dark"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    href="/minha-conta"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-plum-soft hover:bg-rose-light/50 hover:text-rose-dark"
                    onClick={() => setOpen(false)}
                  >
                    Dados de contato
                  </Link>
                  <Link
                    href="/minha-conta/pedidos"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-plum-soft hover:bg-rose-light/50 hover:text-rose-dark"
                    onClick={() => setOpen(false)}
                  >
                    Meus pedidos
                  </Link>
                  {user.role === "admin" && (
                    <>
                      <Link
                        href="/admin"
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-plum-soft hover:bg-rose-light/50 hover:text-rose-dark"
                        onClick={() => setOpen(false)}
                      >
                        Painel Administrativo
                      </Link>
                      <Link
                        href="/admin/configuracoes"
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-plum-soft hover:bg-rose-light/50 hover:text-rose-dark"
                        onClick={() => setOpen(false)}
                      >
                        Configurações - Administrador
                      </Link>
                    </>
                  )}
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-error hover:bg-error-light"
                    >
                      Sair
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/entrar"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-plum-soft hover:bg-rose-light/50 hover:text-rose-dark"
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
