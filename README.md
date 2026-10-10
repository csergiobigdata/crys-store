# Chrys Store

Loja virtual de acessórios, itens de casa e kits de presente, feita com
Next.js (App Router) + Supabase + Resend, hospedada na Vercel.

**Versão do aplicativo: 1.2.0 (fixa).** Ela aparece na janela "Sobre" do
rodapé e **não muda a cada deploy** — ver [Versão fixa](#versão-fixa).
Histórico de mudanças em [CHANGELOG.md](CHANGELOG.md); arquitetura e modelo de
dados em [docs/arquitetura.md](docs/arquitetura.md); guia de operação no dia a
dia em [docs/operacao.md](docs/operacao.md).

## Em que fase o projeto está

| Fase | Situação |
|---|---|
| **1ª fase — Pix** (QR Code + comprovante + confirmação pelo administrador) | **No ar** em `https://crys-store.vercel.app` |
| **2ª fase — Mercado Pago** (cartão em até 6x e confirmação automática do Pix) | **Não iniciada por decisão do dono.** O código existe, mas está desligado (`CARD_PAYMENTS_ENABLED`) e sem credenciais. Será pedida à parte. |
| Domínio próprio + e-mail para clientes (Resend com domínio verificado) | Pendente, a cargo do dono |

Enquanto o cartão não for liberado, a página inicial, o checkout e os Termos
de Uso avisam que o cartão em até 6x "ainda não está liberado" e "em breve".

## Stack

- **Front-end / back-end**: Next.js 16 (App Router, Server Actions e Route Handlers), TypeScript, Tailwind CSS v4
- **Banco, autenticação e arquivos**: Supabase (Postgres + Auth + Storage + Realtime)
- **Pagamento**: Pix estático (QR Code próprio, confirmação manual); Pix automático e cartão pelo Mercado Pago (2ª fase)
- **E-mail**: Resend
- **Validação**: Zod · **Imagens**: sharp (reduz o comprovante anexado ao e-mail)
- **Testes**: Vitest · **Hospedagem**: Vercel (com Vercel Cron)

## Funcionalidades

### Loja
- Catálogo com filtros e busca, página de produto, categorias na faixa do topo
  (com mais de 3 categorias os botões ficam compactos; máximo de **10**).
- **Carrinho** rápido: +/− respondem na hora, quantidade digitável, lixeira por
  produto; o carrinho de visitante é unido ao da conta no login.
- **Checkout** (convidado ou logado) com CEP automático, **frete** e **cupom**:
  - Correios (PAC, SEDEX, Mini Envios) por zona, a partir de Atibaia-SP;
  - **Entrega local** (Atibaia): taxa por **faixa de distância** (R$ 0,00 a
    R$ 50,00, definida pelo administrador) e **motoboy** (valor fixo do
    administrador); a opção "Entrega local — A combinar com a loja" mostra um
    aviso em destaque (a loja só despacha depois de combinar);
  - a mesma opção local vale para qualquer destino quando há **produto de teste**
    no carrinho;
  - **Cupom**: botão **Aplicar** com desconto imediato no resumo; código de até 15
    caracteres; teto de **30%** do valor dos produtos (sem frete); uso **único por
    cliente** (conta, CPF ou e-mail); mensagens claras para cupom inexistente,
    fora da vigência, esgotado, abaixo do pedido mínimo ou já utilizado.
- **Pix**: QR Code e "copia e cola"; o cliente envia o comprovante (clicar ou
  arrastar, pré-visualização, JPG/PNG/WebP/PDF até 5 MB); o administrador confirma
  no painel. O e-mail ao administrador leva o comprovante **anexado, no menor
  tamanho possível** (imagem até 1600 px em WebP/JPEG/PNG, o menor; PDF igual).
- **Conta**: cadastro/login, "Esqueci minha senha", dados de entrega, apelido,
  telefone, histórico de pedidos e exclusão de conta (LGPD). Depois do login abre a
  página inicial.
- **Sobre** (rodapé): logomarca, versão e contato do administrador principal.
- **Fale Conosco**: mensagem com filtro de palavrões; vai por e-mail a **todos os
  administradores** e fica guardada no painel.
- Páginas legais (Termos, Privacidade, Trocas, Entrega) e aviso de cookies.

### Painel administrativo (`/admin`)
- **Visão geral** com contadores e o card **"Online agora"** (abas abertas e em qual
  área do site; anônimo, via Supabase Realtime).
- **Produtos** (status A/I, fotos, variações e estoque, marca "Produto de teste"),
  **Categorias** (máx. 10), **Cupons** (nome de até 10 caracteres, código, teto 30%).
- **Pedidos**: confirmar/recusar Pix, marcar como enviado, estornar cartão e
  **cancelar** com justificativa (guarda quem cancelou, data/hora/segundo em
  horário de Brasília e o motivo).
- **Mensagens** (Fale Conosco), **Relatórios**, **Auditoria**.
- **Administradores**: de 1 a **3**; só o **principal** gerencia a lista, e o e-mail e o
  telefone dele são o contato público da loja.
- **Configurações**: prazo do Pix, chave Pix, dados da empresa e **entrega local**
  (CEP/coordenadas da loja, faixas de distância e valor do motoboy).
- "Esvaziar carrinho" só para administradores, sempre sobre o próprio carrinho.

## Pré-requisitos

- Node.js 20.9+ (o projeto foi desenvolvido com Node 24) e npm
- Conta no [Supabase](https://supabase.com), na [Vercel](https://vercel.com) e no
  [Resend](https://resend.com) (a do Resend deve ser criada com o **e-mail do dono
  da loja**, ver [E-mails](#e-mails-resend))

## Instalação local

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

Preencha `.env.local` conforme [Variáveis de ambiente](#variáveis-de-ambiente).
**Nunca** commite `.env.local` — só o `.env.example` (sem valores) é versionado.

## Banco de dados (Supabase)

1. Crie o projeto (região **South America (São Paulo)** é a ideal).
2. Em **Project Settings → API Keys**, copie a URL, a chave `anon` e a `service_role`
   (**nunca** exponha a `service_role` ao navegador: ela só é usada em
   `lib/supabase/admin.ts`, protegido por `import "server-only"`).
3. Aplique as migrações de `supabase/migrations/` **em ordem, uma por vez**, pelo SQL
   Editor (ou `npx supabase db push`). Hoje são **25 migrações**:

| Migração | Conteúdo |
|---|---|
| 0001–0011 | Extensões, perfis, catálogo, carrinho e cupons, pedidos, pagamentos, frete e configurações, auditoria, RLS, buckets de arquivos, limite de tentativas |
| 0012–0015 | Função do checkout, ciclo de vida do Pix, Mercado Pago, ações administrativas de pedido |
| 0016 | Status do produto (A/I) |
| 0017 | Correção do `search_path` do checkout (pgcrypto) |
| 0018 | Número do pedido mensal (`cs-AAAA-MM-NNNNNN`) e promoção a admin pelo SQL Editor |
| 0019 | Lembrete de pagamento |
| 0020 | Pix dinâmico pelo Mercado Pago (`confirm_pix_payment_by_mp`) |
| 0021 | Apelido do usuário e dados do cancelamento de pedido |
| 0022 | Limite de 10 categorias e flag de produto de teste |
| 0023 | Nome do cupom, teto de 30% de desconto no checkout |
| 0024 | Cupom de uso único por cliente |
| 0025 | Administrador principal, limite de 3 administradores e mensagens do Fale Conosco |

4. **Dados de exemplo** (`supabase/seed.sql`): só para desenvolvimento. **Não rode em
   produção.**
5. **Authentication → URL Configuration**: Site URL = domínio da loja.

> Os arquivos `supabase/aplicar-*.sql` são apenas roteiros de apoio para bancos que
> já tinham parte das migrações; o caminho oficial é a pasta `migrations/`.

### Administradores
O primeiro administrador é promovido pelo SQL Editor (a pessoa precisa ter conta
confirmada):

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'email@exemplo.com');
```

O administrador **mais antigo** vira o **principal** na migração `0025`. Depois, o
principal adiciona ou remove os outros (até 3) em **Admin → Administradores**.
O telefone de contato do principal é editado em **Minha conta → Seus dados**.

## Variáveis de ambiente

Veja `.env.example`. Resumo (na Vercel: **Config** = visível/pública, **Secret** =
escondida; só as `NEXT_PUBLIC_*` podem ser Config):

| Variável | Para quê | Tipo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase no navegador e no servidor (sujeito a RLS) | Config |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase ignorando RLS, só no servidor | Secret |
| `NEXT_PUBLIC_SITE_URL` | Links absolutos (e-mails, redefinição de senha, QR do Pix). Sem `/` no final | Config |
| `PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY` | Pix estático (padrão; o admin pode trocar em Configurações) | Secret |
| `PIX_EXPIRATION_HOURS` | Prazo do Pix (padrão 24) | — |
| `RESEND_API_KEY` | Envio de e-mails | Secret |
| `ADMIN_NOTIFICATION_EMAIL` | E-mail dos avisos de pedido (**o da administradora**) | Secret |
| `EMAIL_FROM` | Remetente. Vazio = `onboarding@resend.dev` (só entrega ao dono da conta Resend) | — |
| `CRON_SECRET` | Autoriza a rota do agendamento. **Só caracteres ASCII** (use o gerador abaixo) | Secret |
| `CARD_PAYMENTS_ENABLED` | `true` liga o cartão (2ª fase). Vazio = só Pix | — |
| `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_MAX_INSTALLMENTS` | Mercado Pago (2ª fase) | — |

Gerar um `CRON_SECRET` seguro (só números e letras):

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

> ⚠️ **Já aconteceu:** um `CRON_SECRET` com caractere acentuado (`ê`) fez a Vercel
> recusar **todos** os deploys em 3 a 5 segundos, com a mensagem *"The CRON_SECRET
> environment variable contains characters that are not valid in HTTP headers"*,
> porque o Vercel Cron envia o valor num cabeçalho HTTP. Depois de trocar uma
> variável, é preciso fazer **Redeploy**.

## E-mails (Resend)

Há dois limites do **modo de teste** do Resend (remetente `onboarding@resend.dev`):
1. ele só entrega ao **e-mail com o qual a conta Resend foi criada** — por isso a conta
   deve ser a do dono da loja (`chrysstoreapp@gmail.com`), e não a do desenvolvedor;
2. **clientes não recebem e-mails** (pedido recebido, pagamento confirmado,
   redefinição de senha) até haver um **domínio próprio verificado** no Resend e a
   variável `EMAIL_FROM` apontar para ele.

E-mails enviados hoje: pedido criado, novo pedido Pix, comprovante enviado (com o
arquivo anexado), pagamento confirmado, lembrete de pagamento, Fale Conosco (um
e-mail por administrador, para um não bloquear o outro) e redefinição de senha.
O envio é "melhor esforço": se falhar, o pedido e a mensagem continuam salvos e o
painel **Mensagens** mostra o motivo.

> O e-mail de **confirmação de cadastro** é o do Supabase Auth (remetente `noreply`
> do Supabase, com limite baixo de envios por hora). Para produção, configure o SMTP
> do Resend em **Authentication → SMTP Settings** depois de ter o domínio.

## Pix

- **Estático** (1ª fase): o QR Code usa a chave Pix da loja (normalizada: telefone vira
  `+55…`). O cliente paga, envia o comprovante e o administrador confirma em
  `/admin/pedidos`.
- **Automático** (2ª fase, via Mercado Pago): com `MP_ACCESS_TOKEN` configurado, o pedido
  Pix é criado na API (QR único, vencimento igual ao do pedido) e o webhook
  `/api/webhooks/mercadopago` o confirma sozinho. Falhando, cai no Pix estático.

## Expiração automática de pedidos

Pedidos Pix vencidos e pedidos de cartão abandonados são expirados (liberando o estoque)
de duas formas combinadas:

1. **Ao acessar**: abrir a página do pedido já expira o que venceu.
2. **Varredura agendada**: o **Vercel Cron** (`vercel.json`) chama
   `GET /api/cron/expire-orders` **uma vez por dia, às 06:00 UTC (03:00 em Brasília)**,
   o máximo do plano Hobby. A rota exige `Authorization: Bearer <CRON_SECRET>` (a Vercel
   envia sozinha quando `CRON_SECRET` existe no projeto) e também envia o lembrete de
   pagamento do dia seguinte.

## Versão fixa

A versão do aplicativo é **1.2.0** e **não deve mudar** a cada deploy, correção ou
funcionalidade: é uma decisão do dono do projeto. Ela vive em `lib/app-version.ts` (exibida
em "Sobre") e o `package.json` acompanha — um teste (`lib/app-version.test.ts`) falha se
divergirem. Mudanças novas entram na seção "1.2.0 (versão atual)" do CHANGELOG. Só se cria
outra versão quando o dono pedir expressamente.

## Rodando e testando

```bash
npm run dev               # desenvolvimento
npm run build             # build de produção (deve compilar sem erros)
npm run lint              # ESLint
npx tsc --noEmit          # tipos
npm test                  # testes unitários (Vitest)
npm run test:integration  # exige um Supabase de TESTE (ver abaixo)
```

Hoje: **134 testes unitários passando**. Cobrem, entre outros: CPF, checkout, formatação
(moeda, CEP, telefone, datas em Brasília), CRC16 e BR Code do Pix, assinatura do webhook,
escape de HTML nos e-mails, extensão segura de arquivos, frete (zonas, Correios, entrega
local por raio, motoboy), regras de cupom (nome, 30%, uso), filtro de palavrões, contato,
senha e redefinição, presença "online agora", compressão do comprovante e a versão fixa.

**Testes de integração** (`tests/integration/`) foram escritos mas **nunca executados** contra
um banco real. Rode-os só contra um projeto Supabase **dedicado a testes**:

```bash
SUPABASE_TEST_URL=... SUPABASE_TEST_SERVICE_ROLE_KEY=... SUPABASE_TEST_ANON_KEY=... \
npm run test:integration
```

## Segurança

Revisão feita por leitura de código (não por ataque real). Resumo:
- Toda rota e Server Action administrativa passa por `requireAdmin()` (o principal, em
  ações de administradores, por `requirePrimaryAdmin()`).
- Funções SQL `security definer` fixam o `search_path` e liberam execução só à `service_role`.
- RLS em todas as tabelas; `contact_messages`, `mercadopago_payments` e `audit_log` só
  o administrador lê.
- E-mails escapam HTML; uploads usam extensão validada; sem `dangerouslySetInnerHTML`.
- Cabeçalhos de segurança e CSP em `next.config.ts` (inclui `wss://*.supabase.co` para o
  Realtime e os domínios do Mercado Pago).
- Limites de tentativas (login, cadastro, checkout, cupom, Fale Conosco, redefinição de senha).
- **Redefinição de senha**: resposta idêntica exista ou não a conta; token de uso único,
  consumido só ao enviar a senha nova (não ao abrir o link).
- **Presença "online agora"** é anônima: só a área do site, nunca URL, nome ou e-mail.
- O redirecionamento pós-login só aceita caminhos do próprio site.

## Deploy (Vercel)

1. Repositório no GitHub (privado) importado na Vercel; framework Next.js, build padrão.
2. Cadastre as variáveis de [Variáveis de ambiente](#variáveis-de-ambiente) (valores de produção).
3. A cada `git push` na `main` a Vercel faz o deploy; **variável alterada só vale após
   Redeploy**.
4. Supabase: aplique as migrações antes de publicar código que dependa delas (ex.: o código
   da `0025` lê `profiles.is_primary_admin`).
5. O Cron já está em `vercel.json` (confira em **Settings → Cron Jobs**).

Detalhes operacionais, diagnósticos e pendências em [docs/operacao.md](docs/operacao.md).

## Antes de divulgar a loja

- [ ] Trocar os dados da empresa, fotos e preços dos produtos (previsto em até 72 h).
- [ ] Telefone do administrador principal: **19 97423-0904** (Minha conta → Seus dados, ou SQL
      em [docs/operacao.md](docs/operacao.md)).
- [ ] Teste real de compra Pix (a cargo do dono, após o deploy).
- [ ] Domínio próprio verificado no Resend + `EMAIL_FROM` (para clientes receberem e-mails)
      e SMTP do Resend no Supabase Auth (confirmação de cadastro).
- [ ] Revisar os trechos `[REVISAR]` das páginas legais.
