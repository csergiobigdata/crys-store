-- profiles: estende auth.users com os dados de negócio do cliente/admin.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  cpf text,
  phone text,
  role text not null default 'cliente' check (role in ('cliente', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

-- Cria automaticamente um profile ao cadastrar um usuário no Supabase Auth.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_auth_user();

-- addresses: endereços salvos de um usuário logado, reutilizáveis entre pedidos.
create table addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  label text,
  cep text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger addresses_set_updated_at
  before update on addresses
  for each row
  execute function set_updated_at();

create index addresses_profile_id_idx on addresses (profile_id);
