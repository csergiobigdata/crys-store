import { NextResponse } from "next/server";
import { sendPendingPaymentReminders } from "@/lib/orders/payment-reminders";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Varredura agendada que envia o lembrete de pagamento pendente (dia seguinte
 * ao pedido) e expira pedidos Pix vencidos e pedidos de cartão abandonados, liberando o estoque — reforço ao "verificação ao acessar"
 * feito em getOrderForViewing (docs/arquitetura.md, seção 4). Configure um
 * Netlify Scheduled Function ou Cloudflare Cron Trigger para chamar esta
 * rota periodicamente (ex.: a cada 15 min) com o header Authorization abaixo.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Primeiro os lembretes (de pedidos ainda válidos), depois a expiração.
  const remindersSent = await sendPendingPaymentReminders();

  const supabase = createAdminClient();
  const { data: expiredCount, error } = await supabase.rpc("expire_overdue_orders");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expiredCount, remindersSent });
}
