"use client";

import {
  ChevronDown,
  ContactRound,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Settings2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth/actions";
import { getDisplayName } from "@/lib/auth/display-name";
import type { CurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

const itemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-plum transition-colors hover:bg-rose-light/50 hover:text-rose-dark";

/**
 * Menu do usuário logado (nome no cabeçalho): dados de contato, pedidos,
 * "Painel Administrativo" e "Configurações - Administrador" (só para admin) e
 * Sair. O Painel Administrativo abre a página do painel, com o menu lateral
 * de Visão geral, Produtos, Categorias etc.
 */
export function UserMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = getDisplayName(user);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-plum-soft transition-colors hover:bg-rose-light/50 hover:text-rose-dark"
      >
        <User className="h-5 w-5" aria-hidden="true" />
        {displayName}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-rose-light bg-white p-2 shadow-card-hover"
        >
          <div className="px-3 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-plum">
              {user.role === "admin" ? displayName : (user.fullName ?? displayName)}
            </p>
            <p className="truncate text-xs text-plum-soft">{user.email}</p>
            {user.role === "admin" && (
              <span className="mt-1 inline-block rounded-full bg-rose-light px-2 py-0.5 text-[11px] font-semibold text-rose-dark">
                Administrador
              </span>
            )}
          </div>
          <div className="my-1 border-t border-rose-light" />

          <Link href="/minha-conta" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <ContactRound className="h-4 w-4" aria-hidden="true" />
            Dados de contato
          </Link>
          <Link
            href="/minha-conta/pedidos"
            role="menuitem"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            Meus pedidos
          </Link>
          {user.role === "admin" && (
            <>
              <Link href="/admin" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Painel Administrativo
              </Link>
              <Link
                href="/admin/configuracoes"
                role="menuitem"
                className={itemClass}
                onClick={() => setOpen(false)}
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Configurações - Administrador
              </Link>
            </>
          )}

          <div className="my-1 border-t border-rose-light" />
          <form action={logout}>
            <button type="submit" role="menuitem" className={cn(itemClass, "text-error hover:text-error")}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
