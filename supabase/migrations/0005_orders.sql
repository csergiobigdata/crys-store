-- Pedidos: tabela central, itens e histórico de status.

create sequence order_number_seq;

-- Gera números no formato CS-AAAA-NNNNN (reinicia a sequência visualmente
-- por ano só na formatação; o contador interno é sempre crescente, o que é
-- suficiente para garantir unicidade e simplicidade).
create or replace function generate_order_number()
returns text
language sql
as $$
  select 'CS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
$$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default generate_order_number(),
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  profile_id uuid references profiles (id) on delete set null,
  guest_name text,
  guest_email text,
  guest_phone text,
  guest_cpf text,
  shipping_address jsonb not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_cost numeric(10, 2) not null default 0 check (shipping_cost >= 0),
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  coupon_id uuid references coupons (id) on delete set null,
  total numeric(10, 2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('pix', 'cartao')),
  status text not null default 'criado' check (status in (
    'criado', 'aguardando_pagamento', 'em_analise', 'pago', 'em_separacao',
    'enviado', 'entregue', 'cancelado', 'expirado', 'pagamento_recusado',
    'estornado'
  )),
  pix_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_owner_check check (
    profile_id is not null or (guest_name is not null and guest_email is not null)
  )
);

create trigger orders_set_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

create index orders_profile_id_idx on orders (profile_id);
create index orders_status_idx on orders (status);
create index orders_access_token_idx on orders (access_token);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete set null,
  product_name_snapshot text not null,
  variant_attributes_snapshot jsonb not null default '{}'::jsonb,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0)
);

create index order_items_order_id_idx on order_items (order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on order_status_history (order_id);
