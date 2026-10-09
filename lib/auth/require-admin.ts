import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Toda rota/Server Action administrativa chama isto primeiro — a role é
 * sempre conferida no servidor, nunca assumida a partir do estado do cliente.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar?redirect=/admin");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

/** Ações que só o administrador principal faz (ex.: gerenciar os administradores). */
export async function requirePrimaryAdmin() {
  const user = await requireAdmin();

  if (!user.isPrimaryAdmin) {
    redirect("/admin");
  }

  return user;
}
