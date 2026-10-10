-- Script seguro (idempotente): pode ser rodado mais de uma vez. 0016 já aplicada.

-- ===== 0017 =====
-- Corrige "Não foi possível finalizar o pedido" no checkout.
--
-- checkout_create_order() gera o token de acesso com gen_random_bytes(), que é
-- da extensão pgcrypto. No Supabase as extensões ficam no schema `extensions`,
-- mas a função foi criada com `set search_path = public`, então o Postgres não
-- encontra gen_random_bytes e o pedido falha com:
--   function gen_random_bytes(integer) does not exist
-- Incluir `extensions` no search_path da função resolve.

alter function checkout_create_order(
  uuid, text, text, text, text, jsonb, numeric, jsonb, text, text, int
) set search_path = public, extensions;

-- ===== 0018 =====
-- 1) Novo formato do número do pedido: cs-AAAA-MM-NNNNNN
--    AAAA = ano da compra, MM = mês da compra, NNNNNN = nº do pedido NAQUELE
--    mês (a contagem recomeça em 000001 a cada mês). Ex.: cs-2026-10-000013.
--    O mês é o de Brasília, não o do servidor (UTC).
--
--    Pedidos antigos (CS-2026-00013 etc.) mantêm o número que já têm.

create table if not exists order_number_counters (
  period text primary key, -- 'AAAA-MM'
  last_value int not null default 0
);

-- Sem policies: só a função abaixo (security definer) e a service role mexem.
alter table order_number_counters enable row level security;

create or replace function generate_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM');
  v_seq int;
begin
  -- O upsert trava a linha do mês, então dois pedidos simultâneos nunca
  -- recebem o mesmo número; se o pedido falhar, a contagem volta junto.
  insert into order_number_counters (period, last_value)
  values (v_period, 1)
  on conflict (period) do update
    set last_value = order_number_counters.last_value + 1
  returning last_value into v_seq;

  return 'cs-' || v_period || '-' || lpad(v_seq::text, 6, '0');
end;
$$;

-- 2) Permitir promover um usuário a admin pelo SQL Editor / service role.
--
--    O gatilho original só liberava mudança de `role` para quem já é admin
--    (is_admin() usa auth.uid()). No SQL Editor não há usuário logado
--    (auth.uid() é nulo), então o `update profiles set role = 'admin'` era
--    desfeito em silêncio. Agora só bloqueia quando há um usuário logado que
--    não é admin (o cliente tentando se promover pela API).
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role and auth.uid() is not null and not is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

-- ===== 0019 =====
-- Lembrete de pagamento pendente: guarda quando o e-mail de lembrete foi
-- enviado, para que cada pedido receba no máximo um (o envio "reivindica" o
-- pedido com um update condicional antes de mandar o e-mail).

alter table orders add column if not exists payment_reminder_sent_at timestamptz;

create index if not exists orders_payment_reminder_idx
  on orders (created_at)
  where status = 'aguardando_pagamento' and payment_reminder_sent_at is null;

-- ===== 0020 =====
-- Pix dinâmico via Mercado Pago: o pagamento é criado pela API (QR único por
-- pedido, vencimento igual ao do pedido) e confirmado sozinho pelo webhook.
-- Pedidos com mp_payment_id nulo continuam no fluxo de Pix estático com
-- comprovante e confirmação manual do admin.

alter table pix_payments
  add column if not exists mp_payment_id text,
  add column if not exists mp_status text;

create unique index if not exists pix_payments_mp_payment_id_key
  on pix_payments (mp_payment_id)
  where mp_payment_id is not null;

-- Chamada pelo webhook. Idempotente: só o primeiro 'approved' muda o pedido.
-- Retorna o estado resultante: 'pago', 'already_processed', 'late_payment'
-- (aprovado depois do pedido expirar/cancelar — exige ação manual do admin)
-- ou 'ignored'.
create or replace function confirm_pix_payment_by_mp(
  p_order_id uuid,
  p_mp_payment_id text,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null or v_order.payment_method <> 'pix' then
    return 'ignored';
  end if;

  update pix_payments
  set mp_status = p_status
  where order_id = p_order_id and mp_payment_id = p_mp_payment_id;

  if not found then
    return 'ignored';
  end if;

  if p_status <> 'approved' then
    return 'ignored';
  end if;

  if v_order.status = 'pago' then
    return 'already_processed';
  end if;

  if v_order.status not in ('aguardando_pagamento', 'em_analise') then
    insert into order_status_history (order_id, from_status, to_status, note)
    values (
      p_order_id, v_order.status, v_order.status,
      'ATENÇÃO: Pix ' || p_mp_payment_id || ' aprovado no Mercado Pago após o pedido ficar '
        || v_order.status || '. Estoque já foi liberado — reembolse ou reative manualmente.'
    );
    return 'late_payment';
  end if;

  update orders set status = 'pago' where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, note)
  values (p_order_id, v_order.status, 'pago', 'Pix confirmado automaticamente (Mercado Pago ' || p_mp_payment_id || ')');

  update pix_payments
  set review_status = 'confirmado', reviewed_at = now()
  where order_id = p_order_id;

  if v_order.coupon_id is not null then
    update coupons set usage_count = usage_count + 1 where id = v_order.coupon_id;
  end if;

  return 'pago';
end;
$$;

revoke all on function confirm_pix_payment_by_mp(uuid, text, text) from public;
grant execute on function confirm_pix_payment_by_mp(uuid, text, text) to service_role;
