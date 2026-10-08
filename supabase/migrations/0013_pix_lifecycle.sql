-- Ciclo de vida do pedido Pix: expiração automática (com devolução de
-- estoque) e confirmação/recusa manual pelo admin — tudo em transações
-- atômicas, chamadas apenas pela service role.

create or replace function expire_pix_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item record;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null
     or v_order.payment_method <> 'pix'
     or v_order.status not in ('aguardando_pagamento', 'em_analise')
     or v_order.pix_expires_at is null
     or v_order.pix_expires_at > now()
  then
    return false;
  end if;

  for v_item in
    select variant_id, quantity from order_items
    where order_id = p_order_id and variant_id is not null
  loop
    update product_variants
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.variant_id;
  end loop;

  update orders set status = 'expirado' where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, note)
  values (p_order_id, v_order.status, 'expirado', 'Prazo de pagamento Pix esgotado — estoque liberado.');

  return true;
end;
$$;

revoke all on function expire_pix_order(uuid) from public;
grant execute on function expire_pix_order(uuid) to service_role;

-- Pedidos de cartão recusados (ou nunca finalizados) não têm pix_expires_at,
-- mas também não devem reter estoque para sempre se o cliente abandonar o
-- pedido sem tentar novamente nem trocar para Pix. Reaproveita a mesma
-- janela de PIX_EXPIRATION_HOURS como prazo geral de "tempo para pagar".
create or replace function expire_stale_card_order(p_order_id uuid, p_max_age_hours int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item record;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null
     or v_order.payment_method <> 'cartao'
     or v_order.status not in ('aguardando_pagamento', 'pagamento_recusado')
     or v_order.created_at > now() - (p_max_age_hours || ' hours')::interval
  then
    return false;
  end if;

  for v_item in
    select variant_id, quantity from order_items
    where order_id = p_order_id and variant_id is not null
  loop
    update product_variants
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.variant_id;
  end loop;

  update orders set status = 'expirado' where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, note)
  values (p_order_id, v_order.status, 'expirado', 'Pedido de cartão abandonado — estoque liberado.');

  return true;
end;
$$;

revoke all on function expire_stale_card_order(uuid, int) from public;
grant execute on function expire_stale_card_order(uuid, int) to service_role;

-- Varredura em lote (chamada por uma rota de cron) para expirar pedidos Pix
-- e de cartão parados, mesmo que ninguém acesse a página deles.
create or replace function expire_overdue_orders(p_card_max_age_hours int default 24)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_count int := 0;
begin
  for v_order_id in
    select id from orders
    where payment_method = 'pix'
      and status in ('aguardando_pagamento', 'em_analise')
      and pix_expires_at is not null
      and pix_expires_at < now()
  loop
    if expire_pix_order(v_order_id) then
      v_count := v_count + 1;
    end if;
  end loop;

  for v_order_id in
    select id from orders
    where payment_method = 'cartao'
      and status in ('aguardando_pagamento', 'pagamento_recusado')
      and created_at < now() - (p_card_max_age_hours || ' hours')::interval
  loop
    if expire_stale_card_order(v_order_id, p_card_max_age_hours) then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function expire_overdue_orders(int) from public;
grant execute on function expire_overdue_orders(int) to service_role;

create or replace function confirm_pix_payment(p_order_id uuid, p_admin_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null
     or v_order.payment_method <> 'pix'
     or v_order.status not in ('aguardando_pagamento', 'em_analise')
  then
    return false;
  end if;

  update orders set status = 'pago' where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, changed_by)
  values (p_order_id, v_order.status, 'pago', p_admin_id);

  update pix_payments
  set review_status = 'confirmado', reviewed_by = p_admin_id, reviewed_at = now()
  where order_id = p_order_id;

  if v_order.coupon_id is not null then
    update coupons set usage_count = usage_count + 1 where id = v_order.coupon_id;
  end if;

  return true;
end;
$$;

revoke all on function confirm_pix_payment(uuid, uuid) from public;
grant execute on function confirm_pix_payment(uuid, uuid) to service_role;

create or replace function reject_pix_payment(p_order_id uuid, p_admin_id uuid, p_note text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null
     or v_order.payment_method <> 'pix'
     or v_order.status not in ('aguardando_pagamento', 'em_analise')
  then
    return false;
  end if;

  update orders set status = 'aguardando_pagamento' where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_order.status, 'aguardando_pagamento', p_admin_id, p_note);

  update pix_payments
  set review_status = 'recusado', reviewed_by = p_admin_id, reviewed_at = now(),
      proof_file_path = null, proof_uploaded_at = null
  where order_id = p_order_id;

  return true;
end;
$$;

revoke all on function reject_pix_payment(uuid, uuid, text) from public;
grant execute on function reject_pix_payment(uuid, uuid, text) to service_role;
