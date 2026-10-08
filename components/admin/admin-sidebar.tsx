"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLinks, isAdminLinkActive } from "@/components/admin/admin-links";
import { cn } from "@/lib/utils/cn";

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-full flex-shrink-0 lg:w-56">
      <p className="mb-4 truncate text-sm text-plum-soft">Olá, {adminName}</p>
      <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {adminLinks.map((link) => {
          const active = isAdminLinkActive(link.href, pathname);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-rose-light/50 text-plum"
                  : "text-plum-soft hover:bg-rose-light/40",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
