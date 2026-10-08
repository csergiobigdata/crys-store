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
