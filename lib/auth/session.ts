import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  fullName: string | null;
  role: "cliente" | "admin";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as "cliente" | "admin") ?? "cliente",
  };
}
