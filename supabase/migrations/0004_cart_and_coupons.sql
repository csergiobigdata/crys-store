-- Carrinho de usuário logado (visitante usa localStorage, nunca esta tabela).
create table cart_items (
  profile_id uuid not null references profiles (id) on delete cascade,
  variant_id uuid not null references product_variants (id) on delete cascade,
  quantity int not null check (quantity > 0),
  updated_at timestamptz not null default now(),
  primary key (profile_id, variant_id)
);

create trigger cart_items_set_updated_at
  before update on cart_items
  for each row
  execute function set_updated_at();

-- Cupons de desconto.
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentual', 'fixo')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_value numeric(10, 2) check (min_order_value >= 0),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  usage_limit int check (usage_limit > 0),
  usage_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger coupons_set_updated_at
  before update on coupons
  for each row
  execute function set_updated_at();

create index coupons_code_idx on coupons (code);
