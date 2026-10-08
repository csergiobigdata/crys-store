-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.
-- É a junção de migrations/0016_product_status.sql e 0017_checkout_pgcrypto_search_path.sql.

-- Status do produto: 'A' (ativo) ou 'I' (inativo), com data de inativação.
--
-- Produtos que já tiveram venda nunca são apagados do banco (o histórico de
-- pedidos depende deles): o admin só os inativa. `status` passa a ser a fonte
-- da verdade; a coluna `active` continua existindo (as policies de RLS e o
-- checkout dependem dela) e é mantida em sincronia por um trigger.

alter table products
  add column status char(1) not null default 'A' check (status in ('A', 'I')),
  add column inactivated_at timestamptz;

-- Backfill a partir do booleano antigo.
update products
set status = case when active then 'A' else 'I' end,
    inactivated_at = case when active then null else now() end;

create or replace function products_sync_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status
     and new.active is distinct from old.active then
    -- Escrita legada só no booleano: traduz para o status.
    new.status := case when new.active then 'A' else 'I' end;
  end if;

  new.active := (new.status = 'A');

  if new.status = 'I' then
    if tg_op = 'UPDATE' and old.status = 'I' then
      new.inactivated_at := coalesce(old.inactivated_at, now());
    else
      new.inactivated_at := now();
    end if;
  else
    new.inactivated_at := null;
  end if;

  return new;
end;
$$;

create trigger products_sync_status
  before insert or update on products
  for each row
  execute function products_sync_status();

create index products_status_idx on products (status);


-- Corrige "Não foi possível finalizar o pedido" no checkout.
--
-- checkout_create_order() gera o token de acesso com gen_random_bytes(), que é
-- da extensão pgcrypto. No Supabase as extensões ficam no schema `extensions`,
-- mas a função foi criada com `set search_path = public`, então o Postgres não
-- encontra gen_random_bytes e o pedido falha com:
--   function gen_random_bytes(integer) does not exist
-- Incluir `extensions` no search_path da função resolve.

alter function checkout_create_order(
  uuid, text, text, text, text, jsonb, numeric, jsonb, text, text, int
) set search_path = public, extensions;
