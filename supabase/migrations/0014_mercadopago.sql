-- Registra o resultado de um pagamento Mercado Pago (chamado tanto pela
-- criação síncrona do pagamento quanto pelo webhook, garantindo
-- idempotência: notificações repetidas não reprocessam o pedido).
--
-- Diferente do Pix, uma recusa de cartão NÃO libera o estoque — o pedido
-- continua "pagamento_recusado" com o estoque retido, para que o cliente
-- possa tentar outro cartão ou trocar para Pix sem perder a reserva. O
-- estoque só é liberado em estorno/cancelamento, ou se o pedido for
-- abandonado além do prazo (expire_stale_card_order).
create or replace function record_mercadopago_payment_result(
  p_order_id uuid,
  p_mp_payment_id text,
  p_status text,
  p_status_detail text,
  p_idempotency_key text,
  p_installments int,
  p_raw_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_new_status text;
  v_item record;
begin
  select * into v_order from orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'order_not_found';
  end if;

  if p_idempotency_key is not null and exists (
    select 1 from mercadopago_payments where idempotency_key = p_idempotency_key
  ) then
    update mercadopago_payments
    set mp_payment_id = coalesce(p_mp_payment_id, mp_payment_id),
        status = p_status,
        status_detail = p_status_detail,
        installments = coalesce(p_installments, installments),
        last_webhook_payload = coalesce(p_raw_payload, last_webhook_payload)
    where idempotency_key = p_idempotency_key;
  elsif p_mp_payment_id is not null and exists (
    select 1 from mercadopago_payments where mp_payment_id = p_mp_payment_id
  ) then
    update mercadopago_payments
    set status = p_status,
        status_detail = p_status_detail,
        last_webhook_payload = coalesce(p_raw_payload, last_webhook_payload)
    where mp_payment_id = p_mp_payment_id;
  else
    insert into mercadopago_payments (
      order_id, mp_payment_id, idempotency_key, installments, status, status_detail, last_webhook_payload
    ) values (
      p_order_id, p_mp_payment_id,
      coalesce(p_idempotency_key, encode(gen_random_bytes(16), 'hex')),
      coalesce(p_installments, 1), p_status, p_status_detail, p_raw_payload
    );
  end if;

  v_new_status := case p_status
    when 'approved' then 'pago'
    when 'rejected' then 'pagamento_recusado'
    when 'refunded' then 'estornado'
    when 'charged_back' then 'estornado'
    when 'cancelled' then 'cancelado'
    else 'aguardando_pagamento'
  end;

  if v_order.payment_method <> 'cartao' or v_order.status = v_new_status then
    return v_order.status;
  end if;

  if v_new_status in ('estornado', 'cancelado') then
    if v_order.status <> 'pago' and v_new_status = 'estornado' then
      return v_order.status;
    end if;

    for v_item in
      select variant_id, quantity from order_items
      where order_id = p_order_id and variant_id is not null
    loop
      update product_variants
      set stock_quantity = stock_quantity + v_item.quantity
      where id = v_item.variant_id;
    end loop;
  elsif v_order.status not in ('aguardando_pagamento', 'pagamento_recusado') then
    -- pedido já num estado terminal (expirado/cancelado/estornado) — não reprocessa
    return v_order.status;
  end if;

  update orders set status = v_new_status where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, note)
  values (
    p_order_id, v_order.status, v_new_status,
    'Mercado Pago: ' || p_status || coalesce(' (' || p_status_detail || ')', '')
  );

  if v_new_status = 'pago' and v_order.coupon_id is not null then
    update coupons set usage_count = usage_count + 1 where id = v_order.coupon_id;
  end if;

  return v_new_status;
end;
$$;

revoke all on function record_mercadopago_payment_result(
  uuid, text, text, text, text, int, jsonb
) from public;
grant execute on function record_mercadopago_payment_result(
  uuid, text, text, text, text, int, jsonb
) to service_role;
