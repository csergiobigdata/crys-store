-- 1) Administrador principal. Só um perfil pode ser o principal, e ele precisa
-- ser administrador. O contato dele (e-mail e telefone) é o que o site mostra
-- em "Atendimento" e em "Sobre".
alter table profiles
  add column is_primary_admin boolean not null default false;

alter table profiles
  add constraint profiles_primary_must_be_admin
  check (not is_primary_admin or role = 'admin');

create unique index profiles_single_primary_admin
  on profiles (is_primary_admin)
  where is_primary_admin;

-- O administrador mais antigo vira o principal.
update profiles
set is_primary_admin = true
where id = (
  select id from profiles where role = 'admin' order by created_at asc limit 1
)
and not exists (select 1 from profiles where is_primary_admin);

-- 2) Máximo de 3 administradores (vale também para promoções feitas direto no SQL Editor).
create or replace function enforce_max_admins()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'admin' and (tg_op = 'INSERT' or old.role is distinct from 'admin') then
    lock table profiles in share row exclusive mode;
    if (select count(*) from profiles where role = 'admin') >= 3 then
      raise exception 'max_admins_reached'
        using errcode = 'P0001', hint = 'O limite é de 3 administradores.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_max_admins
  before insert or update of role on profiles
  for each row
  execute function enforce_max_admins();

-- 3) Quem está logado pela API não consegue se promover a principal: só o
-- servidor (service role / SQL Editor, onde auth.uid() é nulo) muda essa marca.
create or replace function prevent_primary_admin_tampering()
returns trigger
language plpgsql
as $$
begin
  if new.is_primary_admin is distinct from old.is_primary_admin and auth.uid() is not null then
    new.is_primary_admin := old.is_primary_admin;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_primary_tampering
  before update on profiles
  for each row
  execute function prevent_primary_admin_tampering();

-- Troca o administrador principal de forma atômica.
create or replace function set_primary_admin(p_new_primary uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = p_new_primary and role = 'admin') then
    return false;
  end if;
  update profiles set is_primary_admin = false where is_primary_admin;
  update profiles set is_primary_admin = true where id = p_new_primary;
  return true;
end;
$$;

revoke all on function set_primary_admin(uuid) from public;
grant execute on function set_primary_admin(uuid) to service_role;

-- 4) Mensagens do "Fale Conosco". São gravadas antes de qualquer tentativa de
-- e-mail, então nenhuma se perde se o envio falhar. Só a service role grava;
-- os administradores leem e marcam como lidas.
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  profile_id uuid references profiles (id) on delete set null,
  emailed_to text[],
  email_error text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on contact_messages (created_at desc);

alter table contact_messages enable row level security;

create policy contact_messages_admin_select on contact_messages
  for select using (is_admin());

create policy contact_messages_admin_update on contact_messages
  for update using (is_admin()) with check (is_admin());

create policy contact_messages_admin_delete on contact_messages
  for delete using (is_admin());
