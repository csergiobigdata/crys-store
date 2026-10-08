-- Lembrete de pagamento pendente: guarda quando o e-mail de lembrete foi
-- enviado, para que cada pedido receba no máximo um (o envio "reivindica" o
-- pedido com um update condicional antes de mandar o e-mail).

alter table orders add column payment_reminder_sent_at timestamptz;

create index orders_payment_reminder_idx
  on orders (created_at)
  where status = 'aguardando_pagamento' and payment_reminder_sent_at is null;
