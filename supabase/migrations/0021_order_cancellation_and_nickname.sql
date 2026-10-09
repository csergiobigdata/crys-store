-- 1) Apelido ("como quer ser chamado") do usuário, exibido no menu da conta.
alter table profiles
  add column nickname text
  check (nickname is null or char_length(nickname) between 1 and 30);

-- 2) Registro do cancelamento de pedido pelo administrador: quem, quando
-- (timestamptz, exibido em horário de Brasília) e por quê. O nome do
-- administrador é gravado junto (cancelled_by_name) para o histórico
-- continuar legível mesmo se a conta dele for alterada ou excluída.
alter table orders
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references profiles (id) on delete set null,
  add column cancelled_by_name text,
  add column cancellation_reason text,
  add column cancellation_note text;

drop function if exists admin_cancel_order(uuid, uuid, text);

create or replace function admin_cancel_order(
  p_order_id uuid,
  p_admin_id uuid,
  p_reason text,
  p_note text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item record;
  v_admin_name text;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null or v_order.status not in (
    'criado', 'aguardando_pagamento', 'em_analise', 'pago', 'em_separacao', 'pagamento_recusado'
  ) then
    return false;
  end if;

  select coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.nickname), ''), u.email)
    into v_admin_name
  from profiles p
  left join auth.users u on u.id = p.id
  where p.id = p_admin_id;

  for v_item in
    select variant_id, quantity from order_items
    where order_id = p_order_id and variant_id is not null
  loop
    update product_variants
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.variant_id;
  end loop;

  update orders
  set status = 'cancelado',
      cancelled_at = now(),
      cancelled_by = p_admin_id,
      cancelled_by_name = v_admin_name,
      cancellation_reason = p_reason,
      cancellation_note = nullif(trim(p_note), '')
  where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
  values (
    p_order_id, v_order.status, 'cancelado', p_admin_id,
    'Cancelado por ' || coalesce(v_admin_name, 'administrador') || ': ' || p_reason
      || coalesce(' — ' || nullif(trim(p_note), ''), '')
  );

  return true;
end;
$$;

revoke all on function admin_cancel_order(uuid, uuid, text, text) from public;
grant execute on function admin_cancel_order(uuid, uuid, text, text) to service_role;
