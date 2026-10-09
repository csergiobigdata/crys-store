-- 1) Limite de 10 categorias de produto. A Server Action já avisa o admin com
-- uma mensagem amigável; este gatilho garante o limite mesmo se a criação
-- vier de outro caminho (SQL Editor, outra tela, requisições simultâneas).
create or replace function enforce_max_categories()
returns trigger
language plpgsql
as $$
begin
  -- Trava a tabela contra duas criações simultâneas passarem juntas do limite.
  lock table categories in share row exclusive mode;
  if (select count(*) from categories) >= 10 then
    raise exception 'max_categories_reached'
      using errcode = 'P0001', hint = 'O limite é de 10 categorias.';
  end if;
  return new;
end;
$$;

create trigger categories_enforce_max
  before insert on categories
  for each row
  execute function enforce_max_categories();

-- 2) Produto de teste: o admin marca produtos que está avaliando manter no
-- catálogo ou usando para testar o aplicativo. Hoje a marca libera a opção de
-- "Entrega local, a combinar com a loja" no checkout para qualquer destino.
alter table products
  add column is_test boolean not null default false;
