-- Suporte a rate limiting (login, checkout, upload de comprovante — item 8
-- da especificação) sem depender de serviço externo pago.

create table rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_lookup_idx on rate_limit_hits (bucket, identifier, created_at);

-- RLS habilitado sem nenhuma policy: inacessível para anon/authenticated,
-- só o dono da tabela (postgres, via a função abaixo) e a service role leem/escrevem.
alter table rate_limit_hits enable row level security;

-- Conta tentativas de `identifier` em `bucket` na janela de tempo e registra
-- uma nova tentativa se ainda houver margem. Faz sua própria limpeza (apaga
-- hits com mais de 1 dia) para não exigir um job agendado só para isso.
create or replace function check_rate_limit(
  p_bucket text,
  p_identifier text,
  p_max_attempts int,
  p_window_minutes int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from rate_limit_hits where created_at < now() - interval '1 day';

  select count(*) into v_count
  from rate_limit_hits
  where bucket = p_bucket
    and identifier = p_identifier
    and created_at > now() - (p_window_minutes || ' minutes')::interval;

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into rate_limit_hits (bucket, identifier) values (p_bucket, p_identifier);
  return true;
end;
$$;

revoke all on function check_rate_limit(text, text, int, int) from public;
grant execute on function check_rate_limit(text, text, int, int) to service_role;
