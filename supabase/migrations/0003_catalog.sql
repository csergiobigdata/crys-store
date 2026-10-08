-- Catálogo: categorias, produtos, fotos e variações.

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on categories
  for each row
  execute function set_updated_at();

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(10, 2) not null check (base_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

create index products_category_id_idx on products (category_id);
create index products_active_idx on products (active);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt_text text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on product_images (product_id);

-- Toda variação carrega seus atributos em JSONB ({"cor": "Dourado"}),
-- pois acessórios têm atributos heterogêneos (cor, material, comprimento...).
-- Todo produto deve ter ao menos 1 variação, mesmo sem opções reais
-- (attributes = '{}'), para que estoque e carrinho sempre usem variant_id.
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text not null unique,
  attributes jsonb not null default '{}'::jsonb,
  price_override numeric(10, 2) check (price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  image_id uuid references product_images (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_variants_set_updated_at
  before update on product_variants
  for each row
  execute function set_updated_at();

create index product_variants_product_id_idx on product_variants (product_id);
