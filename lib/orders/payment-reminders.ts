import "server-only";
import { sendPaymentReminderEmail } from "@/lib/email/notify-customer";
import { isReminderHour, startOfTodayInBrasilia } from "@/lib/orders/payment-reminder-window";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Manda UM e-mail de lembrete para cada pedido que ainda está "aguardando
 * pagamento" e foi feito em um dia anterior (fuso de Brasília). Roda dentro da
 * varredura agendada (/api/cron/expire-orders), em horário comercial, ANTES de
 * expirar pedidos vencidos — assim um pedido ainda válido é lembrado primeiro.
 *
 * A coluna payment_reminder_sent_at garante que ninguém recebe duas vezes:
 * o pedido é "reivindicado" com um update condicional antes do envio e a
 * reivindicação é desfeita se o e-mail falhar (tenta de novo na próxima rodada).
 */
export async function sendPendingPaymentReminders(now = new Date()): Promise<number> {
  if (!isReminderHour(now)) return 0;

  const supabase = createAdminClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, access_token, guest_email, total, payment_method, pix_expires_at")
    .eq("status", "aguardando_pagamento")
    .is("payment_reminder_sent_at", null)
    .lt("created_at", startOfTodayInBrasilia(now).toISOString())
    .limit(100);

  if (error) {
    console.error("Falha ao buscar pedidos para lembrete:", error.message);
    return 0;
  }

  let sent = 0;
  for (const order of orders ?? []) {
    if (!order.guest_email) continue;
    if (order.pix_expires_at && new Date(order.pix_expires_at) < now) continue;

    const { data: claimed } = await supabase
      .from("orders")
      .update({ payment_reminder_sent_at: now.toISOString() })
      .eq("id", order.id)
      .is("payment_reminder_sent_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) continue; // outra execução já pegou

    const ok = await sendPaymentReminderEmail({
      to: order.guest_email,
      orderNumber: order.order_number,
      accessToken: order.access_token,
      total: Number(order.total),
      paymentMethod: order.payment_method,
      pixExpiresAt: order.pix_expires_at,
    });

    if (ok) {
      sent += 1;
    } else {
      await supabase
        .from("orders")
        .update({ payment_reminder_sent_at: null })
        .eq("id", order.id);
    }
  }

  return sent;
}
