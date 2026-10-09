import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <AdminSidebar
        adminName={admin.nickname ?? admin.fullName ?? admin.email ?? "Admin"}
        isPrimaryAdmin={admin.isPrimaryAdmin}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
