# Chrys Store

E-commerce de acessórios (bolsas, bijuterias, cintos) construído com
Next.js (App Router) + Supabase + Mercado Pago + Pix estático.

> Projeto completo pelas 8 etapas da especificação — veja
> [Status do projeto](#status-do-projeto) no final deste documento. Ainda
> não foi testado de ponta a ponta contra um Supabase/Mercado Pago reais
> (veja [Testes](#testes) e [Revisão de segurança](#revisão-de-segurança)).

Arquitetura e modelo de dados completos: [docs/arquitetura.md](docs/arquitetura.md).

## Stack

- **Front-end**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Back-end**: Server Actions / Route Handlers do Next.js
- **Banco/Auth/Storage**: Supabase (Postgres + Auth + Storage)
- **Pagamentos**: Pix estático (gerador próprio) + Mercado Pago (cartão)
- **E-mail**: Resend
- **Validação**: Zod

## Pré-requisitos

- Node.js 20.9+ e npm
- Uma conta gratuita no [Supabase](https://supabase.com)
- (Mais adiante) uma conta de desenvolvedor no
  [Mercado Pago](https://www.mercadopago.com.br/developers) e no
  [Resend](https://resend.com)

## Instalação

```bash
npm install
cp .env.example .env.local
```

Preencha `.env.local` com as chaves descritas em
[Variáveis de ambiente](#variáveis-de-ambiente). **Nunca** commite
`.env.local` — apenas `.env.example` (sem valores reais) é versionado.

## Configuração do Supabase

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard)
   (plano gratuito).
2. Em **Project Settings → API**, copie para o seu `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**nunca** exponha
     esta chave ao navegador; ela só é usada em código de servidor, em
     `lib/supabase/admin.ts`)
3. Aplique as migrações (todas as tabelas, funções e políticas de RLS em
   `supabase/migrations/`). Duas formas:

   **Opção A — Supabase CLI (recomendado):**

   ```bash
   npx supabase login
   npx supabase link --project-ref <seu-project-ref>
   npx supabase db push
   ```

   **Opção B — SQL Editor do dashboard:** copie e execute o conteúdo de
   cada arquivo em `supabase/migrations/`, em ordem numérica (0001, 0002,
   ...).

4. (Opcional, recomendado em desenvolvimento) Popule com dados de exemplo
   executando o conteúdo de `supabase/seed.sql` no SQL Editor — cria
   categorias, produtos, variações, uma regra de frete fixo e as chaves de
   `app_settings`.

### Como tornar um usuário admin

Não existe fluxo de UI para isso (decisão de segurança). Depois que o usuário
se cadastrar e confirmar o e-mail, rode no SQL Editor do Supabase (exige a
migração `0018`, que permite a promoção por ali):

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'email-do-usuario@exemplo.com');
```

Depois, saia e entre de novo no site e acesse `/admin`.

### Painel administrativo

Depois de logar com uma conta `admin`, acesse `/admin`:

- `/admin/produtos` — CRUD de produtos, fotos (bucket `product-images`) e variações/estoque.
  Todo produto tem **status `A` (ativo) ou `I` (inativo)**; só os `A` aparecem
  na loja. Produto novo nasce `A`. Ao excluir (sempre com confirmação): se o
  produto já tem venda, ele **não é apagado** — vira `I` e a data de
  inativação é gravada; sem vendas, é removido de vez
- `/admin/categorias` — criar, editar e excluir categorias (com confirmação; uma
  categoria com produtos não pode ser excluída, só desativada)
- `/admin/cupons` — cupons de desconto (percentual/fixo, validade, limite de uso)
- `/admin/pedidos` — lista com filtro por status/meio de pagamento; cada
  pedido tem confirmação/recusa de Pix, estorno de cartão, marcar como
  enviado (com rastreio) e cancelar
- `/admin/configuracoes` — prazo do Pix, parcelamento máximo, dados da
  empresa (usados no rodapé do site) e regras de frete
- `/admin/relatorios` — faturamento por período e por meio de pagamento
- `/admin/auditoria` — quem alterou o quê e quando (pedidos, produtos, etc.)

## Páginas legais e LGPD

Textos-modelo já publicados, com trechos marcados **[REVISAR]** onde
dependem de dados reais da empresa ou de decisões de negócio (prazo de
entrega, foro, encarregado de dados, etc.):

- `/termos-de-uso`
- `/politica-de-privacidade`
- `/politica-de-trocas-e-devolucoes` (direito de arrependimento de 7 dias — CDC/Decreto 7.962/2013)
- `/politica-de-entrega`

Esses quatro textos e o rodapé do site leem razão social, CNPJ/CPF,
endereço e contato de `app_settings` (editável em `/admin/configuracoes`) —
**revise esses dados antes de publicar**, pois hoje aparecem como
`[REVISAR] ... não configurado` até serem preenchidos.

Também implementados:
- **Aviso de cookies** — banner fixo no rodapé (cookies essenciais apenas; sem rastreamento).
- **Exclusão de conta** (LGPD, art. 18) — em `/minha-conta`, exclusão
  self-service que remove o usuário do Supabase Auth; pedidos já feitos
  continuam no histórico (como um pedido de convidado), sem ficar
  associados à conta excluída.

## Configuração do Resend (e-mails)

1. Crie uma conta gratuita em [resend.com](https://resend.com) e gere uma API key.
2. Para produção, verifique um domínio próprio no Resend e troque o
   remetente fixo em `lib/email/resend.ts` (`EMAIL_FROM`, hoje marcado
   `[REVISAR]`) por um endereço desse domínio. Em desenvolvimento, o Resend
   permite enviar para o próprio e-mail cadastrado na conta mesmo sem
   domínio verificado.
3. Preencha `RESEND_API_KEY` e `ADMIN_NOTIFICATION_EMAIL` no `.env.local`.

## Configuração do Mercado Pago (sandbox)

1. Crie uma conta em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers/panel).
2. Em **Suas integrações → crie uma aplicação**, você recebe credenciais
   de **teste** e de produção separadas. Use as de **teste** primeiro:
   - `Public key` de teste → `NEXT_PUBLIC_MP_PUBLIC_KEY`
   - `Access token` de teste → `MP_ACCESS_TOKEN`
3. Em **Webhooks**, cadastre a URL `https://<seu-domínio>/api/webhooks/mercadopago`
   (em desenvolvimento local, use um túnel como `ngrok` para expor
   `localhost:3000`) e copie a **assinatura secreta** gerada → `MP_WEBHOOK_SECRET`.
4. Para testar pagamentos sem cartão real, use os
   [cartões de teste do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards) —
   eles simulam aprovação, recusa e diferentes motivos de recusa.
5. Só troque para as credenciais de produção depois de validar o fluxo
   completo (pagamento aprovado, recusado e webhook) no sandbox.

O limite de parcelas exibido no Payment Brick vem de `app_settings.mp_max_installments`
(editável sem redeploy), com `MP_MAX_INSTALLMENTS` como padrão.

## Pix automático (Mercado Pago)

Com `MP_ACCESS_TOKEN` configurado, cada pedido Pix é criado como pagamento
`pix` na API do Mercado Pago (QR único, vencimento igual ao do pedido). O
mesmo webhook do cartão confirma o pagamento (`confirm_pix_payment_by_mp`,
migração `0020`), marca o pedido como pago e envia o e-mail ao cliente — sem
comprovante e sem ação do admin. Exige **chave Pix cadastrada na conta
Mercado Pago**. Se o Mercado Pago não estiver configurado ou falhar na
criação, o checkout cai automaticamente no Pix estático (chave própria,
comprovante e confirmação manual em `/admin/pedidos`). Se um Pix for pago
depois de o pedido expirar, o histórico do pedido recebe um aviso "ATENÇÃO"
para reembolso/reativação manual.

## Expiração automática de pedidos

Pedidos Pix vencidos (prazo em `PIX_EXPIRATION_HOURS`) e pedidos de cartão
abandonados ou recusados sem nova tentativa expiram de duas formas
combinadas, sem depender de infraestrutura paga:

1. **Ao acessar**: toda vez que a página do pedido é aberta, o servidor
   confere o prazo e expira na hora, liberando o estoque.
2. **Varredura agendada**: a rota `GET /api/cron/expire-orders` (protegida
   por `CRON_SECRET` no header `Authorization: Bearer <CRON_SECRET>`) expira
   em lote todos os pedidos vencidos — cobre o caso de ninguém acessar a
   página do pedido. `.github/workflows/expire-orders.yml` já chama essa
   rota a cada 15 minutos via GitHub Actions (grátis, portátil) — só
   precisa configurar os secrets `SITE_URL` e `CRON_SECRET` no repositório
   (**Settings → Secrets and variables → Actions**). Veja
   [Deploy](#deploy) para alternativas nativas do Netlify/Cloudflare.

Pedidos de cartão **recusados** não liberam o estoque imediatamente — o
cliente pode tentar outro cartão ou trocar para Pix sem perder a reserva;
o estoque só volta se o pedido for abandonado além do prazo, estornado ou
cancelado.

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Resumo:

| Variável | Onde é usada |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente Supabase no navegador e no servidor (sujeito a RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` — ignora RLS, só no servidor |
| `PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY`, `PIX_EXPIRATION_HOURS` | gerador do payload Pix (`lib/pix/`) |
| `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_MAX_INSTALLMENTS` | integração Mercado Pago (`lib/mercadopago/`) — Payment Brick, criação de pagamento e validação do webhook |
| `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL` | e-mails transacionais (`lib/email/`) — hoje: pedido criado, novo pedido Pix, comprovante enviado, pagamento confirmado |
| `NEXT_PUBLIC_SITE_URL` | links absolutos em e-mails e no BR Code do Pix |
| `CRON_SECRET` | autoriza a rota `/api/cron/expire-orders` (varredura agendada que expira pedidos Pix e cartão vencidos) |

## Rodando o projeto

```bash
npm run dev      # servidor de desenvolvimento (http://localhost:3000)
npm run build    # build de produção
npm run lint      # ESLint
npx tsc --noEmit  # verificação de tipos
npm run test      # testes unitários (Vitest)
npm run test:integration  # testes de integração — exige um Supabase de teste, ver seção Testes
```

`npm run lint` e a verificação de tipos devem passar sem erros antes de
qualquer entrega.

## Testes

Testes unitários com [Vitest](https://vitest.dev) (`npm run test`), construídos
junto com cada funcionalidade. Hoje cobrem:

- `lib/validations/cpf.ts` — validação de CPF por dígito verificador
- `lib/validations/checkout.ts` — normalização e rejeição de payload de checkout
- `lib/utils/format.ts` — formatação de moeda e CEP
- `lib/pix/crc16.ts` — CRC-16/CCITT-FALSE contra o vetor de teste padrão
  (`"123456789"` → `29B1`) do catálogo de CRCs
- `lib/pix/payload.ts` — geração do BR Code: CRC embutido confere com o
  recalculado de forma independente, ordem e conteúdo dos campos EMV,
  truncamento/remoção de acentos do nome e cidade do recebedor, txid
  alfanumérico
- `lib/mercadopago/verify-webhook-signature.ts` — assinatura HMAC calculada
  manualmente nos testes (mesmo algoritmo documentado pelo Mercado Pago)
  para confirmar que uma assinatura válida é aceita e que payload
  adulterado, segredo errado, header ausente ou timestamp fora da janela
  de tolerância são rejeitados
- `lib/email/escape-html.ts` — e-mails são HTML por interpolação de string
  (não passam pelo escape automático do React); o teste confirma que
  `<`, `>`, `&`, aspas são escapados antes de entrar no template
- `lib/utils/safe-extension.ts` — extensão de arquivo extraída com
  segurança do nome original enviado pelo usuário (upload de comprovante
  Pix e de fotos de produto), rejeitando tentativas de path traversal
  (ex. `evil.png/../../x`)

### Testes de integração (banco real)

`tests/integration/order-lifecycle.integration.test.ts` cobre, contra um
projeto Supabase real com as migrações aplicadas:

- o total do pedido é recalculado a partir do preço no banco;
- dois checkouts simultâneos pela última unidade — só um ganha, o outro
  recebe `insufficient_stock`;
- expiração de um pedido Pix vencido libera o estoque reservado;
- uma notificação de pagamento Mercado Pago duplicada não reprocessa o
  pedido (idempotência);
- RLS impede que um usuário anônimo leia `audit_log` ou `mercadopago_payments`.

**Importante**: esses testes nunca foram executados contra um banco real
— foram escritos e revisados com cuidado, mas eu não tinha acesso a um
projeto Supabase configurado nesta sessão para rodá-los de verdade. Rode-os
você mesmo contra um **projeto Supabase dedicado a testes** (nunca o de
produção) antes de confiar neles:

```bash
SUPABASE_TEST_URL=https://xxxx.supabase.co \
SUPABASE_TEST_SERVICE_ROLE_KEY=eyJ... \
SUPABASE_TEST_ANON_KEY=eyJ... \
npm run test:integration
```

Se algo não bater com o schema na primeira execução, é esperado — ajuste
e me avise o que encontrar.

## Revisão de segurança

Revisão de código feita na Etapa 8 (sem acesso a um ambiente real para
testar, então é revisão estática — "parece certo ao reler o código e as
políticas de RLS", não "testado contra um ataque real"). O que foi
conferido e, nos dois primeiros itens, corrigido:

- **Injeção de HTML em e-mail**: o nome do cliente no checkout entrava
  direto no HTML do e-mail de notificação ao admin, sem escape — corrigido
  com `lib/email/escape-html.ts`, usado em todos os templates.
- **Path traversal no upload de arquivos**: a extensão do arquivo era
  extraída de forma ingênua (`nome.split(".").pop()`); um nome como
  `evil.png/../../x` (sem ponto final) escapava do padrão esperado.
  Corrigido com `lib/utils/safe-extension.ts` (allowlist de caracteres),
  usado no upload de comprovante Pix e de fotos de produto.
- **Imagens do Supabase Storage bloqueadas pelo `next/image`**: o
  `remotePatterns` só liberava `picsum.photos` (usado no seed) — fotos
  reais de produto, vindas do bucket do Supabase, seriam bloqueadas em
  produção. Corrigido em `next.config.ts`.
- **Cabeçalhos de segurança**: `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Strict-Transport-Security` e `Content-Security-Policy`
  adicionados em `next.config.ts` (testado localmente com `next start` —
  os 5 cabeçalhos aparecem corretamente).
  **[REVISAR]** A CSP libera os domínios documentados do Mercado Pago para
  o Payment Brick funcionar (`sdk.mercadopago.com`, `http2.mlstatic.com`,
  `api.mercadopago.com`, `www.mercadopago.com(.br)`). Isso não foi testado
  contra um checkout real — se o cartão não carregar em produção, confira
  o console do navegador por bloqueios de CSP primeiro.
- **Toda rota e Server Action administrativa** passa por `requireAdmin()`,
  verificado ponto a ponto (10 arquivos em `lib/admin/`).
- **Toda função SQL `security definer`** fixa `search_path = public`
  (evita um ataque clássico de hijacking de search_path) e tem
  `revoke/grant` explícito restringindo a execução à `service_role`.
- Nenhuma SQL dinâmica (`EXECUTE`) em nenhuma migração — sem superfície de
  SQL injection nas funções do banco.
- Nenhum `dangerouslySetInnerHTML` no código — XSS nas páginas do site em
  si é mitigado pelo escape automático do React; o único lugar com HTML
  por string eram os e-mails, já corrigido acima.
- Chave `service_role` só é referenciada em `lib/supabase/admin.ts`
  (guardado por `import "server-only"`, que quebra o build se um Client
  Component importar esse módulo).
- CSRF nas Server Actions é tratado pelo próprio Next.js (checagem de
  `Origin` automática); não há rotas de API tradicionais recebendo POST de
  formulário HTML além do webhook (protegido por assinatura) e do cron
  (protegido por secret).

**Gaps conhecidos, não implementados** (fora do que a especificação
pedia, mas vale registrar):
- Sem fluxo de "esqueci minha senha" — a especificação não pediu
  explicitamente, mas é esperado em produção real.
- CSP e lista de domínios do Mercado Pago não validados contra um
  checkout real (ver acima).
- Testes de integração escritos mas não executados (ver
  [Testes de integração](#testes-de-integração-banco-real)).

## Deploy

### Netlify ou Cloudflare Pages

1. Suba o código para um repositório Git (GitHub/GitLab/Bitbucket).
2. Crie o site no [Netlify](https://app.netlify.com) ou no
   [Cloudflare Pages](https://dash.cloudflare.com) e conecte o repositório.
   Ambos detectam Next.js automaticamente; comando de build:
   `npm run build`. Não defina diretório de publicação manual — o
   runtime de cada plataforma cuida disso.
3. Configure **todas** as variáveis de `.env.example` no painel de
   variáveis de ambiente da plataforma, com valores de **produção**
   (nunca os valores fictícios de `.env.local`):
   - Supabase: URL/chaves do projeto de produção (rode as migrações nele
     também, como em [Configuração do Supabase](#configuração-do-supabase)).
   - Mercado Pago: troque as credenciais de **teste** pelas de
     **produção** só depois de validar o fluxo completo no sandbox.
   - `NEXT_PUBLIC_SITE_URL`: o domínio final (ex. `https://chrysstore.com.br`).
4. No painel do Mercado Pago, atualize a URL do webhook para
   `https://<seu-domínio>/api/webhooks/mercadopago`.
5. Habilite a varredura de expiração de pedidos: configure os secrets
   `SITE_URL` e `CRON_SECRET` no GitHub (repositório → **Settings → Secrets
   and variables → Actions**) para o workflow
   `.github/workflows/expire-orders.yml` funcionar. Alternativas nativas:
   um Netlify Scheduled Function ou um Cloudflare Cron Trigger chamando a
   mesma rota — exigem uma function wrapper própria de cada plataforma,
   não cobertas aqui.
6. HTTPS é automático em ambas as plataformas; o `Strict-Transport-Security`
   já configurado em `next.config.ts` reforça isso.

### Antes de ir ao ar, de verdade

- [ ] Rodar as migrações no projeto Supabase de **produção** (não o de
      testes).
- [ ] Preencher os dados reais da empresa em `/admin/configuracoes`
      (os textos legais e o rodapé mostram `[REVISAR]` até isso acontecer).
- [ ] Verificar um domínio no Resend e atualizar `EMAIL_FROM` em
      `lib/email/resend.ts`.
- [ ] Trocar as credenciais do Mercado Pago de teste para produção.
- [ ] Testar um pagamento Pix e um pagamento no cartão de ponta a ponta.
- [ ] Promover o primeiro usuário admin (ver
      [Como tornar um usuário admin](#como-tornar-um-usuário-admin)).

## Status do projeto

Etapas da especificação original e progresso:

- [x] 1. Arquitetura e modelo de dados ([docs/arquitetura.md](docs/arquitetura.md))
- [x] 2. Setup do projeto, banco, migrações e autenticação
- [x] 3. Catálogo, carrinho e checkout
- [x] 4. Pagamento Pix estático
- [x] 5. Pagamento Mercado Pago
- [x] 6. Painel administrativo
- [x] 7. Páginas legais, e-mails e acabamento visual
- [x] 8. Testes finais, revisão de segurança e README final
