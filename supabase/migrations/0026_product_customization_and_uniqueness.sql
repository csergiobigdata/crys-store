alter table products
  add column is_customized boolean not null default false;

create unique index products_name_unique_idx
  on products (lower(btrim(name)));

drop policy products_select on products;
create policy products_select on products
  for select using (is_admin() or (active and not is_test));

drop policy product_images_select on product_images;
create policy product_images_select on product_images
  for select using (
    is_admin()
    or exists (
      select 1 from products p
      where p.id = product_images.product_id and p.active and not p.is_test
    )
  );

drop policy product_variants_select on product_variants;
create policy product_variants_select on product_variants
  for select using (
    is_admin()
    or (
      active
      and exists (
        select 1 from products p
        where p.id = product_variants.product_id and p.active and not p.is_test
      )
    )
  );
