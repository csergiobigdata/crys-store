import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Resolve o e-mail de contato do pedido (da conta logada ou do convidado). */
export async function getOrderContactEmail(orderId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("order_number, access_token, guest_email, profile_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!data) return null;

  if (data.profile_id) {
    const { data: profile } = await supabase.auth.admin.getUserById(data.profile_id);
    return {
      email: profile.user?.email ?? data.guest_email,
      orderNumber: data.order_number,
      accessToken: data.access_token,
    };
  }

  return {
    email: data.guest_email,
    orderNumber: data.order_number,
    accessToken: data.access_token,
  };
}
