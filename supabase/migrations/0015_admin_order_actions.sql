-- Ações administrativas sobre pedidos (item 7 da especificação):
-- cancelar (libera estoque se ainda não tiver sido liberado) e marcar
-- como enviado (grava o código de rastreio).

create or replace function admin_cancel_order(p_order_id uuid, p_admin_id uuid, p_note text)
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

  if v_order.id is null or v_order.status not in (
    'criado', 'aguardando_pagamento', 'em_analise', 'pago', 'em_separacao', 'pagamento_recusado'
  ) then
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

  update orders set status = 'cancelado' where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_order.status, 'cancelado', p_admin_id, p_note);

  return true;
end;
$$;

revoke all on function admin_cancel_order(uuid, uuid, text) from public;
grant execute on function admin_cancel_order(uuid, uuid, text) to service_role;

create or replace function admin_mark_order_shipped(
  p_order_id uuid, p_admin_id uuid, p_tracking_code text, p_carrier text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null or v_order.status not in ('pago', 'em_separacao') then
    return false;
  end if;

  update orders set status = 'enviado' where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, changed_by)
  values (p_order_id, v_order.status, 'enviado', p_admin_id);

  insert into shipments (order_id, carrier, tracking_code, shipped_at)
  values (p_order_id, p_carrier, p_tracking_code, now())
  on conflict (order_id) do update
  set carrier = excluded.carrier,
      tracking_code = excluded.tracking_code,
      shipped_at = excluded.shipped_at;

  return true;
end;
$$;

revoke all on function admin_mark_order_shipped(uuid, uuid, text, text) from public;
grant execute on function admin_mark_order_shipped(uuid, uuid, text, text) to service_role;
