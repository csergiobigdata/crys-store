-- 1) Novo formato do número do pedido: cs-AAAA-MM-NNNNNN
--    AAAA = ano da compra, MM = mês da compra, NNNNNN = nº do pedido NAQUELE
--    mês (a contagem recomeça em 000001 a cada mês). Ex.: cs-2026-10-000013.
--    O mês é o de Brasília, não o do servidor (UTC).
--
--    Pedidos antigos (CS-2026-00013 etc.) mantêm o número que já têm.

create table order_number_counters (
  period text primary key, -- 'AAAA-MM'
  last_value int not null default 0
);

-- Sem policies: só a função abaixo (security definer) e a service role mexem.
alter table order_number_counters enable row level security;

create or replace function generate_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM');
  v_seq int;
begin
  -- O upsert trava a linha do mês, então dois pedidos simultâneos nunca
  -- recebem o mesmo número; se o pedido falhar, a contagem volta junto.
  insert into order_number_counters (period, last_value)
  values (v_period, 1)
  on conflict (period) do update
    set last_value = order_number_counters.last_value + 1
  returning last_value into v_seq;

  return 'cs-' || v_period || '-' || lpad(v_seq::text, 6, '0');
end;
$$;

-- 2) Permitir promover um usuário a admin pelo SQL Editor / service role.
--
--    O gatilho original só liberava mudança de `role` para quem já é admin
--    (is_admin() usa auth.uid()). No SQL Editor não há usuário logado
--    (auth.uid() é nulo), então o `update profiles set role = 'admin'` era
--    desfeito em silêncio. Agora só bloqueia quando há um usuário logado que
--    não é admin (o cliente tentando se promover pela API).
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role and auth.uid() is not null and not is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;
