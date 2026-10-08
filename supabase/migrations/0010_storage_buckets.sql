-- Buckets do Supabase Storage.
-- product-images: público (catálogo precisa exibir fotos sem autenticação).
-- payment-proofs: privado (comprovantes de Pix; só admin e service role).
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('product-images', 'product-images', true, 5242880),
  ('payment-proofs', 'payment-proofs', false, 5242880)
on conflict (id) do nothing;

-- product-images: qualquer um lê; só admin escreve.
create policy product_images_bucket_read on storage.objects
  for select using (bucket_id = 'product-images');

create policy product_images_bucket_write on storage.objects
  for all using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

-- payment-proofs: só admin lê pelo client; upload do comprovante pelo
-- cliente é feito por uma Server Action com service role (que ignora RLS),
-- nunca direto do navegador — por isso não existe policy de insert aqui
-- para authenticated/anon.
create policy payment_proofs_bucket_admin_read on storage.objects
  for select using (bucket_id = 'payment-proofs' and is_admin());
