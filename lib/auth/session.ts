import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  fullName: string | null;
  nickname: string | null;
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
    .select("full_name, nickname, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? null,
    nickname: profile?.nickname ?? null,
    role: (profile?.role as "cliente" | "admin") ?? "cliente",
  };
}
