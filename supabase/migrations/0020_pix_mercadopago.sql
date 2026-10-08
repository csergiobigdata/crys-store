-- Pix dinâmico via Mercado Pago: o pagamento é criado pela API (QR único por
-- pedido, vencimento igual ao do pedido) e confirmado sozinho pelo webhook.
-- Pedidos com mp_payment_id nulo continuam no fluxo de Pix estático com
-- comprovante e confirmação manual do admin.

alter table pix_payments
  add column mp_payment_id text,
  add column mp_status text;

create unique index pix_payments_mp_payment_id_key
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
