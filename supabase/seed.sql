-- Dados de exemplo para desenvolvimento local (supabase db reset aplica
-- este arquivo depois das migrações). As fotos são do Pexels (licença livre
-- para uso comercial, sem atribuição obrigatória) — troque pelas fotos reais
-- da loja em /admin/produtos antes de produção.

insert into categories (id, name, slug, description, active) values
  ('f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Acessórios', 'acessorios', 'Pulseiras, colares, brincos, anéis, chaveiros e acessórios de cabelo.', true),
  ('9981c6b5-f1da-5c48-a7f8-546895b4ad41', 'Casa e decoração', 'casa-e-decoracao', 'Imãs de geladeira, porta-copos e mimos para deixar a casa mais bonita.', true),
  ('e7a8dbf0-94f0-58a2-8709-846887b38256', 'Mimos (Linha de presentes)', 'mimos', 'Kits presenteáveis e lembrancinhas para datas especiais.', true);

insert into products (id, category_id, name, slug, description, base_price, active) values
  ('7ef533fe-74af-5347-981d-6864344c558c', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Pulseira Trançada Dourada', 'pulseira-trancada-dourada', 'Pulseira de elos trançados com banho dourado e fecho ajustável. Delicada para o dia a dia e elegante para ocasiões especiais.', 59.9, true),
  ('8cedb9d8-f544-51ea-87f5-c6118d0e0f24', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Colar Flor Dourada', 'colar-flor-dourada', 'Colar de corrente fina com pingente em formato de flor, acabamento dourado e detalhes texturizados.', 79.9, true),
  ('330f35f8-8c8d-548b-9e41-00afef8e2d86', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Brinco Argola Cristal', 'brinco-argola-cristal', 'Argolas folheadas com cristais brilhantes em toda a volta. Fecho seguro e leveza para usar o dia inteiro.', 69.9, true),
  ('96bd5631-f978-516b-8a2f-90b4690270a7', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Tornozeleira Âncora', 'tornozeleira-ancora', 'Tornozeleira em cordão trançado com pingentes de âncora. Ajuste regulável, ótima para o verão.', 39.9, true),
  ('15fd5609-3187-5565-9f9b-b3dcbbd74f52', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Anel Regulável Delicado', 'anel-regulavel-delicado', 'Anel dourado em elos delicados com abertura regulável, serve em diversos tamanhos. Combina com tudo.', 44.9, true),
  ('41395466-81b4-5b13-8894-93ccc4aa255e', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Corrente para Óculos Elegance', 'corrente-para-oculos', 'Corrente para óculos que une charme e praticidade: evita perder ou quebrar os óculos e ainda vira um acessório.', 34.9, false),
  ('4cca0f9b-826e-5328-97b6-630468801922', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Phone Strap Pérolas', 'phone-strap-perolas', 'Cordão de pérolas para celular (phone strap), em versão para pulso ou para pendurar na capinha.', 29.9, false),
  ('b676ab6a-2726-5ea1-a6ca-f43f3d6a256d', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Chaveiro Personalizado', 'chaveiro-personalizado', 'Chaveiro personalizado com a inicial, o nome ou um pingente à sua escolha. Escreva a personalização na observação do pedido.', 24.9, true),
  ('ab2d3b1d-71c1-51a4-9c3f-22c66c8aae4a', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Scrunchie Estampado', 'scrunchie-estampado', 'Elástico de cabelo em tecido macio, volumoso e estampado. Prende sem marcar nem machucar os fios.', 19.9, true),
  ('de25a557-c58d-59ed-83b1-7ce562657b93', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Presilhas Decoradas Florzinha', 'presilhas-florzinha', 'Kit de presilhas decoradas com florzinhas coloridas para dar um toque divertido ao penteado.', 22.9, true),
  ('868c0970-079d-5285-9c90-6fbaafa611fc', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Tiara Bordada', 'tiara-bordada', 'Tiara de tecido com bordado artesanal. Confortável, não aperta e deixa qualquer look mais especial.', 49.9, true),
  ('36f8c1b1-7320-59c9-a9eb-c560dfc8fc39', 'f635b50e-4dfd-5de5-af86-a37dc8a57f69', 'Laço de Tecido', 'laco-de-tecido', 'Laço de fita em tecido, perfeito para tranças, rabos de cavalo e penteados românticos.', 18.9, true),
  ('c568f7cb-cb83-5ee3-b3e3-788fe61c9ef8', '9981c6b5-f1da-5c48-a7f8-546895b4ad41', 'Kit de Imãs de Geladeira', 'imas-de-geladeira', 'Kit com imãs decorativos coloridos para a geladeira. Deixa a cozinha mais alegre e segura recados e fotos.', 32.9, true),
  ('c99b2b6b-086e-5d3a-8fe6-adff26cae17c', '9981c6b5-f1da-5c48-a7f8-546895b4ad41', 'Porta-copos de Madeira Geométrico', 'porta-copos-madeira', 'Jogo de porta-copos em madeira com recorte geométrico. Protege a mesa com muito estilo.', 39.9, true),
  ('c4e871c3-bc82-5721-99a1-4209d9cc1b1b', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Kit Presente Dia das Mães', 'kit-dia-das-maes', 'Caixa presenteável para o Dia das Mães, com mimos selecionados e cartão para escrever uma mensagem de carinho.', 119.9, true),
  ('c6e19732-f9d4-572c-9b0c-1622356971de', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Kit Presente Namorados', 'kit-namorados', 'Kit romântico em caixa com laço de fita, montado para surpreender no Dia dos Namorados.', 129.9, true),
  ('385dfb8e-29c5-5154-8b18-b5bc9cc4b372', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Kit Presente Natal', 'kit-natal', 'Caixa de presente natalina com acabamento em laço, pronta para entregar. Encanta em qualquer amigo secreto.', 99.9, true),
  ('a241ac63-424c-5fb1-b027-f515f89970af', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Kit Madrinhas', 'kit-madrinhas', 'Kit para convidar as madrinhas com carinho: caixa decorada com laço e mimo especial dentro.', 89.9, true),
  ('e4e1efd7-68af-5c16-89a0-b09c001a7d0e', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Lembrancinha de Casamento', 'lembrancinha-casamento', 'Caixinha de lembrança para os convidados do casamento. Vendida por unidade, com desconto para quantidades maiores sob encomenda.', 14.9, true),
  ('3759e970-c10b-565a-820a-e16152acfa4e', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Lembrancinha de Maternidade', 'lembrancinha-maternidade', 'Lembrancinha delicada para entregar na maternidade ou no chá de bebê. Vendida por unidade.', 12.9, true),
  ('8773c5be-4a2d-51a8-9a66-6bc9f63eb890', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Kit Pulseira, Vela e Cartão', 'kit-pulseira-vela-cartao', 'Caixa presenteável com pulseira, vela aromática e cartão para mensagem. Um presente completo que valoriza qualquer ocasião.', 149.9, true);

insert into product_images (id, product_id, url, alt_text, position) values
  ('f25cdb57-caff-5764-b9c4-68f44727954d', '7ef533fe-74af-5347-981d-6864344c558c', 'https://images.pexels.com/photos/12124662/pexels-photo-12124662.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Pulseira trançada dourada sobre tecido azul', 0),
  ('8beb92ae-163f-5de7-a7fe-bc7fda3290fd', '8cedb9d8-f544-51ea-87f5-c6118d0e0f24', 'https://images.pexels.com/photos/13292666/pexels-photo-13292666.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Colar com pingente de flor dourada sobre tecido rosa', 0),
  ('e496bfd1-59d8-5e57-b7f5-0a818ec8b38a', '330f35f8-8c8d-548b-9e41-00afef8e2d86', 'https://images.pexels.com/photos/20943477/pexels-photo-20943477.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Par de argolas douradas com cristais', 0),
  ('34e4a156-1667-5691-a2a4-f81534c97003', '96bd5631-f978-516b-8a2f-90b4690270a7', 'https://images.pexels.com/photos/5676230/pexels-photo-5676230.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Tornozeleira com pingente de âncora', 0),
  ('174bd2cf-eb24-526d-997a-96a9eeb02846', '15fd5609-3187-5565-9f9b-b3dcbbd74f52', 'https://images.pexels.com/photos/10581426/pexels-photo-10581426.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Anel dourado delicado sobre tecido branco', 0),
  ('95725b23-1294-50c7-9531-434930b753e1', 'b676ab6a-2726-5ea1-a6ca-f43f3d6a256d', 'https://images.pexels.com/photos/12615733/pexels-photo-12615733.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Chaveiro rosa com pingentes pendurado em uma chave', 0),
  ('c6a1b29e-871f-53cc-9d5d-ef5ba9fcd50a', 'ab2d3b1d-71c1-51a4-9c3f-22c66c8aae4a', 'https://images.pexels.com/photos/7261697/pexels-photo-7261697.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Scrunchies coloridos estampados', 0),
  ('8ff6e5bb-c12c-5cdf-bc0c-1745c0beaec8', 'de25a557-c58d-59ed-83b1-7ce562657b93', 'https://images.pexels.com/photos/10598821/pexels-photo-10598821.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Presilhas coloridas decorando o cabelo', 0),
  ('fbe4486c-6666-5955-a5c8-80631e46a30d', '868c0970-079d-5285-9c90-6fbaafa611fc', 'https://images.pexels.com/photos/5500529/pexels-photo-5500529.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Mulher usando tiara colorida', 0),
  ('8589f814-02d5-55f0-9cbd-a085710a92f2', '36f8c1b1-7320-59c9-a9eb-c560dfc8fc39', 'https://images.pexels.com/photos/8467968/pexels-photo-8467968.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Laço de fita preta em uma trança', 0),
  ('c6474729-bc6a-5021-8e14-835f4361dc5d', 'c568f7cb-cb83-5ee3-b3e3-788fe61c9ef8', 'https://images.pexels.com/photos/17113874/pexels-photo-17113874.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Imãs de geladeira coloridos', 0),
  ('682a20f5-fcd1-52b1-809f-d6491e212ea2', 'c99b2b6b-086e-5d3a-8fe6-adff26cae17c', 'https://images.pexels.com/photos/30907557/pexels-photo-30907557.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Porta-copos de madeira com xícara de chá', 0),
  ('ec0f20af-4140-5e21-9233-c5f4a0ddcc47', 'c4e871c3-bc82-5721-99a1-4209d9cc1b1b', 'https://images.pexels.com/photos/7763957/pexels-photo-7763957.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixa de presente rosa com cartão de Dia das Mães', 0),
  ('0b6e6762-17aa-5374-9dca-6a2991be894d', 'c6e19732-f9d4-572c-9b0c-1622356971de', 'https://images.pexels.com/photos/5704738/pexels-photo-5704738.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixa de presente rosa com laço de fita', 0),
  ('792b8605-7914-53a6-b32e-f8c7ff0fcb40', '385dfb8e-29c5-5154-8b18-b5bc9cc4b372', 'https://images.pexels.com/photos/29463110/pexels-photo-29463110.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixas de presente de Natal com laço vermelho', 0),
  ('becff46a-2f55-545e-a7c5-54c5eb8002a9', 'a241ac63-424c-5fb1-b027-f515f89970af', 'https://images.pexels.com/photos/5493207/pexels-photo-5493207.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixa de presente verde com laço sendo entregue', 0),
  ('2a798af8-89c8-5b90-b4ed-9e072f3951ea', 'e4e1efd7-68af-5c16-89a0-b09c001a7d0e', 'https://images.pexels.com/photos/1050336/pexels-photo-1050336.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixinhas de presente pequenas com laços de fita', 0),
  ('c4b11a67-a404-5f05-bde4-c4a66d7e8a58', '3759e970-c10b-565a-820a-e16152acfa4e', 'https://images.pexels.com/photos/4397900/pexels-photo-4397900.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixinha de presente rosa sobre uma mesa', 0),
  ('af433f5e-00ef-5969-9fc4-cc82515876ec', '8773c5be-4a2d-51a8-9a66-6bc9f63eb890', 'https://images.pexels.com/photos/10924502/pexels-photo-10924502.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixa de presente branca com velas aromáticas', 0);

insert into product_variants (product_id, sku, attributes, price_override, stock_quantity, image_id, active) values
  ('7ef533fe-74af-5347-981d-6864344c558c', 'PUL-TRANC-DOURADA', '{"cor": "Dourado"}'::jsonb, null, 18, 'f25cdb57-caff-5764-b9c4-68f44727954d', true),
  ('8cedb9d8-f544-51ea-87f5-c6118d0e0f24', 'COL-FLOR-DOURADO', '{"cor": "Dourado"}'::jsonb, null, 14, '8beb92ae-163f-5de7-a7fe-bc7fda3290fd', true),
  ('330f35f8-8c8d-548b-9e41-00afef8e2d86', 'BRI-ARG-CRISTAL-DOURADO', '{"cor": "Dourado"}'::jsonb, null, 20, 'e496bfd1-59d8-5e57-b7f5-0a818ec8b38a', true),
  ('96bd5631-f978-516b-8a2f-90b4690270a7', 'TOR-ANCORA-MARROM', '{"cor": "Marrom"}'::jsonb, null, 16, '34e4a156-1667-5691-a2a4-f81534c97003', true),
  ('15fd5609-3187-5565-9f9b-b3dcbbd74f52', 'ANE-REG-DOURADO', '{"cor": "Dourado"}'::jsonb, null, 22, '174bd2cf-eb24-526d-997a-96a9eeb02846', true),
  ('41395466-81b4-5b13-8894-93ccc4aa255e', 'COR-OCU-DOURADA', '{"cor": "Dourado"}'::jsonb, null, 25, null, true),
  ('41395466-81b4-5b13-8894-93ccc4aa255e', 'COR-OCU-PRATA', '{"cor": "Prata"}'::jsonb, null, 25, null, true),
  ('4cca0f9b-826e-5328-97b6-630468801922', 'PHO-PEROLAS-BRANCO', '{"cor": "Branco"}'::jsonb, null, 30, null, true),
  ('b676ab6a-2726-5ea1-a6ca-f43f3d6a256d', 'CHA-PERS-INICIAL', '{"personalização": "Inicial"}'::jsonb, null, 40, '95725b23-1294-50c7-9531-434930b753e1', true),
  ('b676ab6a-2726-5ea1-a6ca-f43f3d6a256d', 'CHA-PERS-NOME', '{"personalização": "Nome"}'::jsonb, 29.9, 40, '95725b23-1294-50c7-9531-434930b753e1', true),
  ('b676ab6a-2726-5ea1-a6ca-f43f3d6a256d', 'CHA-PERS-PINGENTE', '{"personalização": "Pingente"}'::jsonb, 27.9, 40, '95725b23-1294-50c7-9531-434930b753e1', true),
  ('ab2d3b1d-71c1-51a4-9c3f-22c66c8aae4a', 'SCR-VERMELHO', '{"cor": "Vermelho"}'::jsonb, null, 25, 'c6a1b29e-871f-53cc-9d5d-ef5ba9fcd50a', true),
  ('ab2d3b1d-71c1-51a4-9c3f-22c66c8aae4a', 'SCR-AMARELO', '{"cor": "Amarelo"}'::jsonb, null, 25, 'c6a1b29e-871f-53cc-9d5d-ef5ba9fcd50a', true),
  ('ab2d3b1d-71c1-51a4-9c3f-22c66c8aae4a', 'SCR-AZUL', '{"cor": "Azul"}'::jsonb, null, 25, 'c6a1b29e-871f-53cc-9d5d-ef5ba9fcd50a', true),
  ('de25a557-c58d-59ed-83b1-7ce562657b93', 'PRE-FLOR-MIX', '{"cor": "Sortido"}'::jsonb, null, 35, '8ff6e5bb-c12c-5cdf-bc0c-1745c0beaec8', true),
  ('868c0970-079d-5285-9c90-6fbaafa611fc', 'TIA-BORD-ROSA', '{"cor": "Rosa"}'::jsonb, null, 12, 'fbe4486c-6666-5955-a5c8-80631e46a30d', true),
  ('868c0970-079d-5285-9c90-6fbaafa611fc', 'TIA-BORD-AZUL', '{"cor": "Azul"}'::jsonb, null, 12, 'fbe4486c-6666-5955-a5c8-80631e46a30d', true),
  ('36f8c1b1-7320-59c9-a9eb-c560dfc8fc39', 'LAC-PRETO', '{"cor": "Preto"}'::jsonb, null, 30, '8589f814-02d5-55f0-9cbd-a085710a92f2', true),
  ('36f8c1b1-7320-59c9-a9eb-c560dfc8fc39', 'LAC-ROSA', '{"cor": "Rosa"}'::jsonb, null, 30, '8589f814-02d5-55f0-9cbd-a085710a92f2', true),
  ('c568f7cb-cb83-5ee3-b3e3-788fe61c9ef8', 'IMA-KIT-6', '{"kit": "6 unidades"}'::jsonb, null, 30, 'c6474729-bc6a-5021-8e14-835f4361dc5d', true),
  ('c99b2b6b-086e-5d3a-8fe6-adff26cae17c', 'POR-MAD-4', '{"kit": "4 unidades"}'::jsonb, null, 24, '682a20f5-fcd1-52b1-809f-d6491e212ea2', true),
  ('c4e871c3-bc82-5721-99a1-4209d9cc1b1b', 'KIT-MAES', '{"kit": "Caixa completa"}'::jsonb, null, 15, 'ec0f20af-4140-5e21-9233-c5f4a0ddcc47', true),
  ('c6e19732-f9d4-572c-9b0c-1622356971de', 'KIT-NAMORADOS', '{"kit": "Caixa completa"}'::jsonb, null, 15, '0b6e6762-17aa-5374-9dca-6a2991be894d', true),
  ('385dfb8e-29c5-5154-8b18-b5bc9cc4b372', 'KIT-NATAL', '{"kit": "Caixa completa"}'::jsonb, null, 20, '792b8605-7914-53a6-b32e-f8c7ff0fcb40', true),
  ('a241ac63-424c-5fb1-b027-f515f89970af', 'KIT-MADRINHA', '{"kit": "Caixa completa"}'::jsonb, null, 20, 'becff46a-2f55-545e-a7c5-54c5eb8002a9', true),
  ('e4e1efd7-68af-5c16-89a0-b09c001a7d0e', 'LEM-CASAMENTO-UN', '{"unidade": "1 unidade"}'::jsonb, null, 100, '2a798af8-89c8-5b90-b4ed-9e072f3951ea', true),
  ('3759e970-c10b-565a-820a-e16152acfa4e', 'LEM-MATERNIDADE-UN', '{"unidade": "1 unidade"}'::jsonb, null, 100, 'c4b11a67-a404-5f05-bde4-c4a66d7e8a58', true),
  ('8773c5be-4a2d-51a8-9a66-6bc9f63eb890', 'KIT-PUL-VELA-CARTAO', '{"kit": "Caixa completa"}'::jsonb, null, 18, 'af433f5e-00ef-5969-9fc4-cc82515876ec', true);

insert into products (id, category_id, name, slug, description, base_price, active) values
  ('6451393b-6301-5871-8e4b-66f866cd337f', 'e7a8dbf0-94f0-58a2-8709-846887b38256', 'Caixa de Presentes (Customizada)', 'caixa-de-presentes-customizada', 'Caixa de presente customizada, com papel listrado e laço de fita em cetim. Escolha a personalização na observação do pedido. Valor por unidade.', 50.0, true);

insert into product_images (id, product_id, url, alt_text, position) values
  ('a2ada023-0402-5360-99a4-b74ca57de811', '6451393b-6301-5871-8e4b-66f866cd337f', 'https://images.pexels.com/photos/5704738/pexels-photo-5704738.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Caixa de presente com papel listrado rosa e laço de fita', 0);

insert into product_variants (product_id, sku, attributes, price_override, stock_quantity, image_id, active) values
  ('6451393b-6301-5871-8e4b-66f866cd337f', 'CAIXA-CUSTOM', '{"tipo": "Customizada"}'::jsonb, null, 50, 'a2ada023-0402-5360-99a4-b74ca57de811', true);

insert into app_settings (key, value) values
  ('pix_expiration_hours', '24'),
  ('mp_max_installments', '6'),
  ('company_info', '{
    "razao_social": "Chrys Store Comércio de Acessórios LTDA",
    "cnpj_ou_cpf": "",
    "endereco": "",
    "contato": "[REVISAR] contato@chrysstore.com.br"
  }'::jsonb);
