-- Pagamento Pix estático (1:1 com orders quando payment_method = 'pix').
create table pix_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade,
  txid text not null,
  payload_emv text not null,
  proof_file_path text,
  proof_uploaded_at timestamptz,
  review_status text not null default 'aguardando' check (review_status in (
    'aguardando', 'em_analise', 'confirmado', 'recusado'
  )),
  reviewed_by uuid references profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index pix_payments_order_id_idx on pix_payments (order_id);

-- Pagamento via Mercado Pago (1:N com orders — registra tentativas recusadas
-- antes de uma aprovada).
create table mercadopago_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  mp_payment_id text,
  idempotency_key text not null unique,
  installments int not null default 1 check (installments >= 1),
  status text not null default 'pending',
  status_detail text,
  last_webhook_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger mercadopago_payments_set_updated_at
  before update on mercadopago_payments
  for each row
  execute function set_updated_at();

create index mercadopago_payments_order_id_idx on mercadopago_payments (order_id);
create index mercadopago_payments_mp_payment_id_idx on mercadopago_payments (mp_payment_id);
