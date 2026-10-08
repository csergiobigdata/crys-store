-- Habilita RLS em todas as tabelas de negócio e define as políticas
-- descritas em docs/arquitetura.md (seção 5). A service role key usada
-- pelo servidor Next.js ignora RLS por padrão — por isso as tabelas sem
-- nenhuma policy de select/insert para anon/authenticated (ex. pagamentos)
-- ficam acessíveis só a partir do servidor.

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_select on profiles
  for select
  using (id = auth.uid() or is_admin());

create policy profiles_update on profiles
  for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

create policy profiles_delete on profiles
  for delete
  using (is_admin());

-- Impede que o próprio cliente se promova a admin via update na própria linha.
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role and not is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on profiles
  for each row
  execute function prevent_role_self_escalation();

-- ---------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------
alter table addresses enable row level security;

create policy addresses_select on addresses
  for select using (profile_id = auth.uid() or is_admin());

create policy addresses_insert on addresses
  for insert with check (profile_id = auth.uid());

create policy addresses_update on addresses
  for update using (profile_id = auth.uid() or is_admin());

create policy addresses_delete on addresses
  for delete using (profile_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------
-- categories / products / product_images / product_variants
-- ---------------------------------------------------------------------
alter table categories enable row level security;

create policy categories_select on categories
  for select using (active or is_admin());

create policy categories_write on categories
  for all using (is_admin()) with check (is_admin());

alter table products enable row level security;

create policy products_select on products
  for select using (active or is_admin());

create policy products_write on products
  for all using (is_admin()) with check (is_admin());

alter table product_images enable row level security;

create policy product_images_select on product_images
  for select using (
    is_admin()
    or exists (
      select 1 from products p
      where p.id = product_images.product_id and p.active
    )
  );

create policy product_images_write on product_images
  for all using (is_admin()) with check (is_admin());

alter table product_variants enable row level security;

create policy product_variants_select on product_variants
  for select using (
    is_admin()
    or (
      active
      and exists (
        select 1 from products p
        where p.id = product_variants.product_id and p.active
      )
    )
  );

create policy product_variants_write on product_variants
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- cart_items
-- ---------------------------------------------------------------------
alter table cart_items enable row level security;

create policy cart_items_all on cart_items
  for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------
-- coupons — sem acesso direto do cliente; validação via Server Action
-- com service role. Só admin lê/escreve pela API do Supabase.
-- ---------------------------------------------------------------------
alter table coupons enable row level security;

create policy coupons_admin_all on coupons
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- orders / order_items / order_status_history
-- Inserts/updates operacionais (criação de pedido, mudança de status) são
-- feitos pelo servidor com service role, que ignora RLS. As policies aqui
-- cobrem apenas leitura pelo próprio cliente logado e gestão pelo admin.
-- ---------------------------------------------------------------------
alter table orders enable row level security;

create policy orders_select on orders
  for select using (profile_id = auth.uid() or is_admin());

create policy orders_admin_update on orders
  for update using (is_admin()) with check (is_admin());

alter table order_items enable row level security;

create policy order_items_select on order_items
  for select using (
    is_admin()
    or exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.profile_id = auth.uid()
    )
  );

alter table order_status_history enable row level security;

create policy order_status_history_select on order_status_history
  for select using (
    is_admin()
    or exists (
      select 1 from orders o
      where o.id = order_status_history.order_id and o.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- pix_payments — sem select/insert para anon/authenticated. A página do
-- pedido é renderizada por um Server Component com service role.
-- Admin pode ver e atualizar (confirmar/recusar) pelo painel.
-- ---------------------------------------------------------------------
alter table pix_payments enable row level security;

create policy pix_payments_admin_select on pix_payments
  for select using (is_admin());

create policy pix_payments_admin_update on pix_payments
  for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- mercadopago_payments — nenhum acesso via client (nem admin); tudo passa
-- por Server Action com service role + API do Mercado Pago.
-- ---------------------------------------------------------------------
alter table mercadopago_payments enable row level security;

-- ---------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------
alter table shipments enable row level security;

create policy shipments_select on shipments
  for select using (
    is_admin()
    or exists (
      select 1 from orders o
      where o.id = shipments.order_id and o.profile_id = auth.uid()
    )
  );

create policy shipments_admin_write on shipments
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- shipping_config
-- ---------------------------------------------------------------------
alter table shipping_config enable row level security;

create policy shipping_config_select on shipping_config
  for select using (active or is_admin());

create policy shipping_config_admin_write on shipping_config
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- app_settings — só as chaves públicas listadas abaixo são legíveis por
-- qualquer visitante (dados de rodapé, prazos exibidos no checkout).
-- ---------------------------------------------------------------------
alter table app_settings enable row level security;

create policy app_settings_public_select on app_settings
  for select using (
    key in ('company_info', 'pix_expiration_hours', 'mp_max_installments')
    or is_admin()
  );

create policy app_settings_admin_write on app_settings
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- audit_log — leitura restrita ao admin; escrita só pelo servidor.
-- ---------------------------------------------------------------------
alter table audit_log enable row level security;

create policy audit_log_admin_select on audit_log
  for select using (is_admin());
