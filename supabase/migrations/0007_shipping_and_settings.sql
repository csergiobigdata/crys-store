create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade,
  carrier text,
  tracking_code text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table shipping_config (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('fixo', 'faixa_cep')),
  cep_range_start text,
  cep_range_end text,
  value numeric(10, 2) not null check (value >= 0),
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_config_faixa_check check (
    type = 'fixo' or (cep_range_start is not null and cep_range_end is not null)
  )
);

create trigger shipping_config_set_updated_at
  before update on shipping_config
  for each row
  execute function set_updated_at();

-- Parâmetros globais editáveis pelo admin em runtime, sem redeploy.
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger app_settings_set_updated_at
  before update on app_settings
  for each row
  execute function set_updated_at();
