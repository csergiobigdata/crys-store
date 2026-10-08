-- Extensões e funções auxiliares usadas em todas as tabelas seguintes.

create extension if not exists "pgcrypto";

-- Mantém updated_at sempre atualizado em qualquer UPDATE.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Usada nas políticas de RLS para checar se o usuário autenticado é admin.
-- security definer: a função pode ler profiles mesmo quando a policy de
-- profiles ainda não liberou o select para o próprio chamador.
--
-- language plpgsql (não sql): funções "language sql" são parse-analisadas
-- na criação (o planner tenta validar/inlinear a query), então exigem que
-- "profiles" já exista — mas profiles só é criada na migração 0002.
-- plpgsql só valida a sintaxe na criação e resolve os nomes na primeira
-- execução, então aceita essa referência "para frente" sem problema.
create or replace function is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;
