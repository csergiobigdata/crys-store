import Link from "next/link";
import type { CurrentUser } from "@/lib/auth/session";
import { listActiveCategories } from "@/lib/catalog/queries";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { CategoryBar } from "./category-bar";
import { HeaderNav } from "./header-nav";

export async function Header({ user }: { user: CurrentUser | null }) {
  const categories = await listActiveCategories();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-rose-light bg-white/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Chrys Store — página inicial"
        >
          <Logo />
        </Link>
        <HeaderNav user={user} />
      </div>
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={null}>
          <CategoryBar categories={categories} />
        </Suspense>
      </div>
    </header>
  );
}
