# Chrys Store — Arquitetura e Modelo de Dados

> Etapa 1 do projeto. Documento de arquitetura, sem código. Pontos marcados com
> **[ASSUNÇÃO]** são decisões que tomei por não estarem especificadas no prompt
> original — revise e me avise se quiser mudar algo antes de eu seguir para a
> Etapa 2 (setup do projeto).

Segmento confirmado: **acessórios** (bolsas, bijuterias, cintos, etc.).
Parcelamento máximo confirmado: **6x** no cartão de crédito (Mercado Pago).

---

## 1. Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Navegador (cliente)                      │
│  Next.js (App Router, RSC) + Tailwind                            │
│  - Páginas públicas (catálogo, produto, carrinho, checkout)      │
│  - Payment Brick do Mercado Pago (tokenização do cartão)         │
│  - Supabase JS client (anon key) — leitura pública + Auth        │
└───────────────────────────┬───────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼───────────────────────────────────────┐
│                  Next.js — Route Handlers / Server Actions        │
│  - Toda regra de negócio: preço, frete, desconto, estoque         │
│  - lib/pix/        → geração do payload BR Code (EMV) + CRC16     │
│  - lib/mercadopago/→ SDK oficial, criação de pagamento, webhook   │
│  - lib/orders/     → máquina de estados, reserva de estoque       │
│  - lib/email/      → disparo via Resend                           │
│  - Usa SUPABASE_SERVICE_ROLE_KEY (nunca exposta ao navegador)     │
└───────────┬───────────────────────────────┬───────────────────────┘
            │                               │
┌───────────▼───────────┐       ┌───────────▼───────────────┐
│ Supabase (Postgres)    │       │ Serviços externos          │
│ - Tabelas + RLS        │       │ - Mercado Pago (SDK/API)   │
│ - Auth (e-mail/senha)  │       │ - Resend (e-mail)           │
│ - Storage (fotos,      │       │ - ViaCEP (busca de CEP)     │
│   comprovantes Pix)    │       │                             │
└─────────────────────────┘       └─────────────────────────────┘
```

**Decisões-chave:**

- Toda a lógica que afeta dinheiro ou estoque roda no servidor (Server
  Actions / Route Handlers), nunca no navegador. O cliente só exibe dados;
  o servidor sempre recalcula.
- O cliente Supabase do navegador usa a **anon key** e só acessa o que as
  políticas RLS permitirem (leitura de catálogo público, próprio carrinho,
  próprios pedidos). A **service role key** só existe no servidor e é usada
  para: gerar o Pix, criar pagamentos no Mercado Pago, confirmar pedidos,
  mover estoque e ler o bucket privado de comprovantes.
- Rotas administrativas (`/admin/**` e as Server Actions correspondentes)
  verificam a role `admin` no servidor a cada chamada — nunca confiam em
  estado do cliente.

---

## 2. Modelo de dados

Convenções gerais:
- Todas as tabelas usam `id uuid default gen_random_uuid()` como chave
  primária, exceto a extensão de `auth.users`.
- Todas as tabelas de negócio têm `created_at timestamptz default now()`;
  as que podem ser editadas também têm `updated_at`.
- Dinheiro é armazenado em `numeric(10,2)`, nunca `float`.
- **RLS habilitado em 100% das tabelas**, sem exceção (seção 5 detalha as
  políticas).

### 2.1 Identidade e perfis

**`profiles`** — estende `auth.users` (1:1).
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK, FK → auth.users.id) | mesmo id do Supabase Auth |
| full_name | text | |
| cpf | text | somente dígitos (11), validado no servidor antes de salvar |
| phone | text | |
| role | text | `cliente` \| `admin`, default `cliente` |
| created_at | timestamptz | |

> **[ASSUNÇÃO]** `role admin` é atribuído manualmente via SQL no painel do
> Supabase, como pedido no item 8 da especificação. Não existe fluxo de UI
> para promover usuários.

**`addresses`** — endereços salvos de um usuário logado (reutilizáveis entre
pedidos). Pedidos de convidado **não** usam esta tabela — o endereço vai
congelado dentro do próprio pedido (ver `orders.shipping_address`).
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| profile_id | uuid (FK → profiles.id) | |
| label | text | ex. "Casa", "Trabalho" — opcional |
| cep | text | 8 dígitos |
| street, number, complement, neighborhood, city, state | text | preenchidos via ViaCEP + complemento manual |
| is_default | boolean | default false |

### 2.2 Catálogo

**`categories`**
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| slug | text unique | |
| description | text | nullable |
| image_url | text | nullable |
| active | boolean | default true |

**`products`**
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| category_id | uuid (FK → categories.id) | nullable |
| name | text | |
| slug | text unique | |
| description | text | |
| base_price | numeric(10,2) | preço-base; cada variação pode sobrescrever |
| active | boolean | default true — produto inativo não aparece no catálogo |
| created_at / updated_at | timestamptz | |

**`product_images`**
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| product_id | uuid (FK → products.id) | |
| url | text | caminho no Supabase Storage (bucket público `product-images`) |
| alt_text | text | obrigatório no formulário admin (acessibilidade) |
| position | int | ordem de exibição na galeria |

**`product_variants`**
Toda a modelagem de variação de acessórios (cor, modelo, material) é feita
aqui com um campo `attributes` em JSONB em vez de colunas fixas — acessórios
têm atributos heterogêneos (uma bolsa varia por cor; um colar pode variar por
comprimento). **Todo produto tem pelo menos 1 variação**, mesmo sem opções
reais (nesse caso `attributes = {}`), para que estoque e carrinho sempre
referenciem `variant_id` de forma uniforme.
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| product_id | uuid (FK → products.id) | |
| sku | text unique | |
| attributes | jsonb | ex. `{"cor": "Dourado"}` |
| price_override | numeric(10,2) | nullable — se null, usa `products.base_price` |
| stock_quantity | int | não-negativo (`check (stock_quantity >= 0)`) |
| image_id | uuid (FK → product_images.id) | nullable — foto específica da variação (ex. cor) |
| active | boolean | default true |

> **[ASSUNÇÃO]** Escolhi `attributes jsonb` genérico em vez de colunas fixas
> `tamanho`/`cor`, por ser acessórios (atributos variados: cor, material,
> comprimento, etc.). Se preferir colunas fixas e tipadas, me avise antes da
> Etapa 2 — muda a modelagem e os formulários do admin.

### 2.3 Carrinho (apenas usuário logado)

Carrinho de visitante vive inteiramente no `localStorage` do navegador
(array de `{variant_id, quantity}`) e nunca toca o banco até o checkout.
Carrinho de usuário logado é persistido para sobreviver entre dispositivos:

**`cart_items`**
| coluna | tipo | notas |
|---|---|---|
| profile_id | uuid (FK → profiles.id) | PK composta |
| variant_id | uuid (FK → product_variants.id) | PK composta |
| quantity | int | `check (quantity > 0)` |
| updated_at | timestamptz | |

PK composta `(profile_id, variant_id)` — adicionar o mesmo item duas vezes
soma quantidade em vez de criar linha nova (`upsert`).

### 2.4 Cupons

**`coupons`**
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| code | text unique | normalizado para caixa alta |
| discount_type | text | `percentual` \| `fixo` |
| discount_value | numeric(10,2) | |
| min_order_value | numeric(10,2) | nullable |
| valid_from / valid_until | timestamptz | |
| usage_limit | int | nullable = ilimitado |
| usage_count | int | default 0 |
| active | boolean | default true |

> **[ASSUNÇÃO]** `usage_count` só incrementa quando o pedido chega ao status
> `pago` (não na criação do pedido) — evita "gastar" o limite do cupom com
> pedidos Pix abandonados/expirados. A validação do cupom no checkout
> confere `usage_count < usage_limit` e datas, com a contagem final
> recalculada no servidor.

### 2.5 Pedidos

**`orders`** — tabela central. Suporta convidado e logado.
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| order_number | text unique | código amigável exibido ao cliente, ex. `cs-2026-10-000013` (ano-mês-sequência do mês) |
| access_token | text unique | token aleatório — permite ao convidado abrir a página do pedido pelo link do e-mail, sem login |
| profile_id | uuid (FK → profiles.id) | nullable (convidado) |
| guest_name, guest_email, guest_phone, guest_cpf | text | preenchidos só quando `profile_id is null` |
| shipping_address | jsonb | endereço **congelado** no momento do pedido (cep, rua, número, complemento, bairro, cidade, UF) |
| subtotal | numeric(10,2) | soma dos itens, calculada no servidor |
| shipping_cost | numeric(10,2) | calculada no servidor a partir de `shipping_config` |
| discount_amount | numeric(10,2) | default 0 |
| coupon_id | uuid (FK → coupons.id) | nullable |
| total | numeric(10,2) | `subtotal + shipping_cost - discount_amount`, sempre recalculado no servidor |
| payment_method | text | `pix` \| `cartao` |
| status | text | ver máquina de estados (seção 3) |
| pix_expires_at | timestamptz | nullable, só para `payment_method = pix` |
| created_at / updated_at | timestamptz | |

**`order_items`** — snapshot do que foi comprado (preço e nome **no momento
da compra**, para não mudar retroativamente se o produto for editado depois).
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| order_id | uuid (FK → orders.id) | |
| variant_id | uuid (FK → product_variants.id) | nullable — mantém histórico mesmo se a variação for excluída depois |
| product_name_snapshot | text | |
| variant_attributes_snapshot | jsonb | |
| unit_price | numeric(10,2) | |
| quantity | int | |
| subtotal | numeric(10,2) | |

**`order_status_history`** — exigido pelo item 8 ("registradas em histórico").
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| order_id | uuid (FK → orders.id) | |
| from_status | text | nullable (null na criação) |
| to_status | text | |
| changed_by | uuid (FK → profiles.id) | nullable = sistema/automático (expiração, webhook) |
| note | text | nullable — ex. motivo de recusa |
| created_at | timestamptz | |

### 2.6 Pagamento — Pix estático

**`pix_payments`** (1:1 com `orders` quando `payment_method = pix`)
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| order_id | uuid unique (FK → orders.id) | |
| txid | text | identificador usado no campo 62/05 do BR Code (= baseado no `order_number`, alfanumérico, até 25 chars) |
| payload_emv | text | payload BR Code completo, guardado para auditoria |
| proof_file_path | text | nullable — caminho no bucket privado `payment-proofs` |
| proof_uploaded_at | timestamptz | nullable |
| review_status | text | `aguardando` \| `em_analise` \| `confirmado` \| `recusado` |
| reviewed_by | uuid (FK → profiles.id) | nullable — admin que confirmou/recusou |
| reviewed_at | timestamptz | nullable |

### 2.7 Pagamento — Mercado Pago (cartão)

**`mercadopago_payments`** (1:N com `orders` — permite registrar tentativas
recusadas antes de uma aprovada)
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| order_id | uuid (FK → orders.id) | |
| mp_payment_id | text | id retornado pelo Mercado Pago |
| idempotency_key | text unique | gerado por tentativa (header `X-Idempotency-Key`) |
| installments | int | |
| status | text | status bruto do MP (`approved`, `rejected`, `in_process`, etc.) |
| status_detail | text | nullable |
| last_webhook_payload | jsonb | nullable — último payload recebido, para depuração |
| created_at / updated_at | timestamptz | |

> Dados de cartão (número, CVV, validade) **nunca** passam por nenhuma
> tabela ou log — o front só envia o token gerado pelo Payment Brick.

### 2.8 Envio

**`shipments`**
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| order_id | uuid unique (FK → orders.id) | |
| carrier | text | nullable — transportadora/Correios |
| tracking_code | text | nullable |
| shipped_at | timestamptz | nullable |
| delivered_at | timestamptz | nullable |

### 2.9 Configuração (editável pelo admin)

**`shipping_config`** — regras de frete por faixa de CEP ou valor fixo.
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| type | text | `fixo` \| `faixa_cep` |
| cep_range_start, cep_range_end | text | nullable, só para `faixa_cep` |
| value | numeric(10,2) | |
| active | boolean | |
| position | int | ordem de avaliação das faixas |

**`app_settings`** — chave/valor para parâmetros globais simples, evita
criar tabela nova a cada novo parâmetro.
| coluna | tipo | notas |
|---|---|---|
| key | text (PK) | ex. `pix_expiration_hours`, `mp_max_installments`, `company_info` |
| value | jsonb | ex. `24`, `6`, `{"razao_social": "...", "cnpj": "...", "endereco": "...", "contato": "..."}` |
| updated_at | timestamptz | |

> **[ASSUNÇÃO]** `PIX_EXPIRATION_HOURS` e `MP_MAX_INSTALLMENTS` existem como
> variável de ambiente (valor padrão/deploy) **e** como linha em
> `app_settings` (valor efetivo, editável pelo admin em runtime sem
> redeploy). O servidor lê de `app_settings` primeiro e cai para o `.env`
> se a chave não existir — assim o painel "Configurações" do item 7 tem
> efeito real.

### 2.10 Auditoria

**`audit_log`**
| coluna | tipo | notas |
|---|---|---|
| id | uuid (PK) | |
| actor_profile_id | uuid (FK → profiles.id) | nullable = sistema |
| entity_type | text | `order` \| `product` \| `coupon` \| ... |
| entity_id | uuid | |
| action | text | `create` \| `update` \| `status_change` \| ... |
| changes | jsonb | diff simplificado (campos alterados) |
| created_at | timestamptz | |

Escrita **somente pelo servidor** (toda Server Action sensível grava uma
linha aqui); não existe escrita client-side.

---

## 3. Máquina de estados do pedido

```
          ┌─────────┐
          │ criado  │
          └────┬────┘
               │
               ▼
     ┌───────────────────┐
     │ aguardando_pagamento│◄────────────┐
     └─────────┬──────────┘              │
       pix │         │ cartão            │ (nova tentativa
           ▼         ▼                   │  de cartão)
   ┌──────────┐  ┌─────────┐             │
   │em_analise│  │ (webhook│─────────────┘
   │(comprovante│ │  MP)   │
   │ enviado) │  └────┬────┘
   └────┬─────┘       │
        │   ┌──────────┴───────────┐
        │   ▼                      ▼
        │ pago                pagamento_recusado
        ▼   │
   (admin   │
   confirma)│
        └───┤
            ▼
         em_separacao
            │
            ▼
         enviado
            │
            ▼
         entregue

  A partir de aguardando_pagamento / em_analise, também pode ir para:
    - expirado   (prazo esgotado sem confirmação — Pix)
    - cancelado  (cliente ou admin cancela)

  A partir de pago, também pode ir para:
    - estornado  (reembolso via Mercado Pago, ou devolução Pix manual)
```

Tabela de transições válidas (a ser implementada como constante única em
`lib/orders/state-machine.ts` na Etapa 2 — este documento é a referência):

| de | para | gatilho |
|---|---|---|
| criado | aguardando_pagamento | sempre, na criação do pedido |
| aguardando_pagamento | em_analise | cliente envia comprovante Pix |
| aguardando_pagamento | pago | webhook Mercado Pago aprova (cartão) |
| aguardando_pagamento | pagamento_recusado | webhook Mercado Pago recusa (cartão) |
| aguardando_pagamento | expirado | job/checagem de prazo (Pix) |
| aguardando_pagamento | cancelado | cliente/admin cancela antes de pagar |
| em_analise | pago | admin confirma comprovante Pix |
| em_analise | recusado→volta a aguardando_pagamento* | admin recusa comprovante |
| pago | em_separacao | admin inicia separação |
| em_separacao | enviado | admin informa código de rastreio |
| enviado | entregue | admin marca como entregue (ou confirmação automática futura) |
| pago / em_separacao / enviado | estornado | estorno Mercado Pago ou devolução Pix |

\* Recusar um comprovante Pix não cancela o pedido automaticamente — volta
para `aguardando_pagamento` para o cliente reenviar, respeitando o prazo
original. **[ASSUNÇÃO]** — se preferir que recusa cancele direto, é uma
troca de uma linha na tabela de transições.

Toda transição grava uma linha em `order_status_history` e, quando aplicável,
dispara e-mail (criado, pago, enviado) e/ou libera estoque (expirado,
cancelado, pagamento_recusado).

---

## 4. Reserva de estoque e concorrência

Para impedir que dois clientes comprem a última unidade simultaneamente
(critério de aceite do item 11):

1. `product_variants.stock_quantity` representa o **estoque disponível para
   venda** (não o estoque físico total separado de reservas).
2. Ao criar um pedido, o servidor abre uma transação Postgres, executa
   `SELECT ... FOR UPDATE` nas linhas de `product_variants` envolvidas
   (trava as linhas), confere `stock_quantity >= quantity` para cada item e,
   se ok, decrementa o estoque e insere pedido + itens na mesma transação.
   Se qualquer item não tiver estoque suficiente, a transação é revertida e
   o cliente recebe erro antes de ir para pagamento.
3. Isso **reserva** o estoque já na criação do pedido (mesmo antes do
   pagamento ser confirmado) — por isso o estoque precisa ser **devolvido**
   (incrementado de volta) quando o pedido vai para `expirado`, `cancelado`
   ou `pagamento_recusado`. Essa devolução também roda em transação.
4. A expiração do Pix é verificada de duas formas combinadas (sem
   dependência de infraestrutura paga): (a) ao qualquer acesso à página do
   pedido ou ao painel admin, o servidor checa `pix_expires_at < now()` e
   expira na hora; (b) uma rotina agendada (cron job do próprio
   Netlify/Cloudflare, gratuito) roda periodicamente para expirar pedidos
   mesmo sem acesso.

---

## 5. Row Level Security — políticas por tabela

Papel usado nas políticas: função `is_admin()` (`security definer`) que
confere `profiles.role = 'admin'` para `auth.uid()`. A **service role key**
usada pelo servidor Next.js ignora RLS por padrão (comportamento do
Supabase) — por isso toda operação sensível (pagamento, confirmação,
estoque) é feita no servidor, nunca direto do navegador.

| tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | próprio registro ou admin | — (criado via trigger no signup) | próprio registro (campos não sensíveis) ou admin | admin |
| addresses | dono (`profile_id = auth.uid()`) ou admin | dono | dono | dono |
| categories | público (`active = true`) ou admin | admin | admin | admin |
| products | público (`active = true`) ou admin | admin | admin | admin |
| product_images | público (via produto ativo) ou admin | admin | admin | admin |
| product_variants | público (via produto ativo, `active = true`) ou admin | admin | admin | admin |
| cart_items | dono (`profile_id = auth.uid()`) | dono | dono | dono |
| coupons | **nenhum acesso direto do cliente** (validação via Server Action) ou admin | admin | admin | admin |
| orders | dono (`profile_id = auth.uid()`) ou admin — convidado acessa via Server Action com `access_token`, não via RLS direta | apenas servidor (service role) | admin (campos operacionais) | — |
| order_items | via pedido do dono ou admin | apenas servidor | — | — |
| order_status_history | via pedido do dono ou admin | apenas servidor | — | — |
| pix_payments | **nenhum acesso direto do cliente** — página do pedido é Server Component que já traz os dados | apenas servidor | admin (confirmar/recusar) | — |
| mercadopago_payments | **nenhum acesso direto do cliente** | apenas servidor | apenas servidor | — |
| shipments | via pedido do dono ou admin | admin | admin | — |
| shipping_config | público (`active = true`) ou admin | admin | admin | admin |
| app_settings | público (somente chaves "seguras" de exibir, ex. dados da empresa) ou admin | admin | admin | admin |
| audit_log | admin | apenas servidor | — | — |

> Convidados (sem login) não têm `auth.uid()`, então nunca batem com
> políticas de "dono" — o acesso de convidado ao próprio pedido é
> deliberadamente feito **fora do RLS**, por uma Server Action que recebe o
> `access_token` da URL e usa a service role para buscar só aquele pedido
> específico. Isso evita expor um `access_token` genérico demais no RLS.

---

## 6. Observações finais / pontos abertos

1. **[ASSUNÇÃO]** Bucket `product-images` público (necessário para exibir
   fotos no catálogo sem autenticação); bucket `payment-proofs` **privado**
   (RLS/policy do Storage restrita a admin + Server Action com service
   role).
2. **[ASSUNÇÃO]** E-mail de confirmação de pedido para convidado contém o
   link `/.../pedidos/[order_number]?token=[access_token]` — é assim que o
   convidado volta a ver o status sem criar conta.
3. **[ASSUNÇÃO]** `order_number` é gerado no servidor no formato
   `cs-AAAA-MM-NNNNNN` (sequência reiniciada a cada mês) — simples de ler em e-mails e no
   painel admin.
4. Ainda não defini os nomes exatos de bucket/variáveis de ambiente
   adicionais além do `.env.example` do prompt original — vou usar
   exatamente o que já foi especificado na seção 10 e só acrescentar o
   necessário (ex. nomes de bucket) quando escrever as migrações, na
   Etapa 2.

---

**Pronto para aprovação.** Se este modelo estiver de acordo, sigo para a
**Etapa 2: setup do projeto, banco, migrações e autenticação**. Qualquer
ajuste nos pontos marcados como [ASSUNÇÃO] (ou em qualquer outra parte do
modelo), me avise antes e eu atualizo este documento primeiro.
