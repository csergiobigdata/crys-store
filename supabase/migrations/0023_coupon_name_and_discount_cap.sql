-- 1) Nome (apelido) do cupom, de até 10 caracteres, para o admin identificá-lo
-- (o código continua sendo o que o cliente digita). Nulo nos cupons antigos;
-- o formulário do painel exige o nome ao salvar.
alter table coupons
  add column name text
  check (name is null or char_length(name) between 1 and 10);

-- 2) Cupom percentual nunca passa de 30%. "not valid" não reexamina cupons já
-- existentes (evita falhar a migração), mas vale para todo cupom novo ou editado.
alter table coupons
  add constraint coupons_percent_max_30
  check (discount_type <> 'percentual' or discount_value <= 30) not valid;

-- 3) Teto de 30% também no cálculo do pedido: vale para o cupom de valor fixo e
-- protege cupons antigos. É a mesma função do checkout (0012 + 0017), com a
-- única mudança no cálculo do desconto.
create or replace function checkout_create_order(
  p_profile_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_guest_cpf text,
  p_shipping_address jsonb,
  p_shipping_cost numeric,
  p_items jsonb, -- [{"variant_id": uuid, "quantity": int}, ...]
  p_payment_method text,
  p_coupon_code text default null,
  p_pix_expiration_hours int default 24
)
returns table (
  order_id uuid,
  order_number text,
  access_token text,
  total numeric
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item record;
  v_variant product_variants%rowtype;
  v_product_base_price numeric;
  v_product_name text;
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric;
  v_coupon coupons%rowtype;
  v_computed_items jsonb := '[]'::jsonb;
  v_order_id uuid;
  v_order_number text;
  v_access_token text;
  v_pix_expires timestamptz;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  for v_item in
    select
      (elem ->> 'variant_id')::uuid as variant_id,
      (elem ->> 'quantity')::int as quantity
    from jsonb_array_elements(p_items) as elem
    order by (elem ->> 'variant_id')::uuid
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'invalid_quantity:%', v_item.variant_id;
    end if;

    select * into v_variant
    from product_variants
    where id = v_item.variant_id
    for update;

    if v_variant.id is null or not v_variant.active then
      raise exception 'variant_not_found:%', v_item.variant_id;
    end if;

    if v_variant.stock_quantity < v_item.quantity then
      raise exception 'insufficient_stock:%', v_item.variant_id;
    end if;

    select name, base_price into v_product_name, v_product_base_price
    from products
    where id = v_variant.product_id and active;

    if v_product_name is null then
      raise exception 'variant_not_found:%', v_item.variant_id;
    end if;

    v_unit_price := coalesce(v_variant.price_override, v_product_base_price);

    update product_variants
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_variant.id;

    v_subtotal := v_subtotal + v_unit_price * v_item.quantity;

    v_computed_items := v_computed_items || jsonb_build_object(
      'variant_id', v_variant.id,
      'product_name_snapshot', v_product_name,
      'variant_attributes_snapshot', v_variant.attributes,
      'unit_price', v_unit_price,
      'quantity', v_item.quantity,
      'subtotal', v_unit_price * v_item.quantity
    );
  end loop;

  if p_coupon_code is not null then
    select * into v_coupon
    from coupons
    where upper(code) = upper(p_coupon_code)
    for update;

    if v_coupon.id is null
       or not v_coupon.active
       or v_coupon.valid_from > now()
       or (v_coupon.valid_until is not null and v_coupon.valid_until < now())
       or (v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit)
       or (v_coupon.min_order_value is not null and v_subtotal < v_coupon.min_order_value)
    then
      raise exception 'invalid_coupon';
    end if;

    v_discount := case
      when v_coupon.discount_type = 'percentual' then round(v_subtotal * v_coupon.discount_value / 100, 2)
      else v_coupon.discount_value
    end;
    -- Regra da loja: o desconto nunca passa de 30% do valor total dos produtos
    -- (sem o frete), qualquer que seja o tipo de cupom.
    v_discount := least(v_discount, v_subtotal, round(v_subtotal * 0.30, 2));
  end if;

  v_total := v_subtotal + coalesce(p_shipping_cost, 0) - v_discount;

  v_order_number := generate_order_number();
  v_access_token := encode(gen_random_bytes(24), 'hex');

  if p_payment_method = 'pix' then
    v_pix_expires := now() + (p_pix_expiration_hours || ' hours')::interval;
  end if;

  insert into orders (
    order_number, access_token, profile_id, guest_name, guest_email, guest_phone, guest_cpf,
    shipping_address, subtotal, shipping_cost, discount_amount, coupon_id, total,
    payment_method, status, pix_expires_at
  ) values (
    v_order_number, v_access_token, p_profile_id, p_guest_name, p_guest_email, p_guest_phone, p_guest_cpf,
    p_shipping_address, v_subtotal, coalesce(p_shipping_cost, 0), v_discount,
    case when p_coupon_code is not null then v_coupon.id else null end,
    v_total, p_payment_method, 'aguardando_pagamento', v_pix_expires
  )
  returning id into v_order_id;

  insert into order_items (
    order_id, variant_id, product_name_snapshot, variant_attributes_snapshot,
    unit_price, quantity, subtotal
  )
  select
    v_order_id,
    (elem ->> 'variant_id')::uuid,
    elem ->> 'product_name_snapshot',
    elem -> 'variant_attributes_snapshot',
    (elem ->> 'unit_price')::numeric,
    (elem ->> 'quantity')::int,
    (elem ->> 'subtotal')::numeric
  from jsonb_array_elements(v_computed_items) as elem;

  insert into order_status_history (order_id, from_status, to_status)
  values (v_order_id, null, 'criado'), (v_order_id, 'criado', 'aguardando_pagamento');

  return query select v_order_id, v_order_number, v_access_token, v_total;
end;
$$;

revoke all on function checkout_create_order(
  uuid, text, text, text, text, jsonb, numeric, jsonb, text, text, int
) from public;
grant execute on function checkout_create_order(
  uuid, text, text, text, text, jsonb, numeric, jsonb, text, text, int
) to service_role;
