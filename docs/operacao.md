# Chrys Store — Guia de operação

Este guia reúne o que é preciso saber para **operar e dar suporte** à loja no dia a dia:
onde cada coisa está, comandos úteis, o que fazer quando algo dá errado e o que ainda
está pendente. Para instalar e entender o projeto, veja o [README](../README.md); para o
modelo de dados, [arquitetura.md](arquitetura.md).

> **Nunca** escreva senhas, chaves de API ou o valor de `CRON_SECRET` neste arquivo, em
> commits, em conversas ou em prints. Elas ficam só no painel da Vercel e do Supabase.

## 1. Onde está cada coisa

| Peça | Onde | Observação |
|---|---|---|
| Código | GitHub `csergiobigdata/crys-store` (privado), branch `main` | Cada push na `main` gera um deploy |
| Site | `https://crys-store.vercel.app` (Vercel, time `cs-ai-team`, plano Hobby) | Domínio próprio ainda não registrado |
| Banco / login / arquivos | Supabase, projeto **Chrys Store** (região us-east-2) | Migrações `0001` a `0025` |
| E-mails | Resend, **conta criada com `chrysstoreapp@gmail.com`** | Modo de teste (ver [§5](#5-e-mails)) |
| Administradora (dona) | `chrysstoreapp@gmail.com` | Administrador **principal** |
| Telefone público | **19 97423-0904** | Em `profiles.phone` do principal |

Decisões do dono que valem sempre:
- A **versão do app é fixa em 1.2.0** (não criar versões nem tags a cada deploy).
- **Mercado Pago (cartão e Pix automático) é a 2ª fase**: só será feito quando o dono pedir.
- **Domínio próprio + Resend** ficam para depois (a cargo do dono).
- Avisos da loja vão **para a administradora**, nunca para o e-mail do desenvolvedor.

## 2. Rotina de publicação

1. `npm run lint`, `npx tsc --noEmit`, `npm test` e `npm run build` devem passar.
2. Se houve migração nova: **aplique no Supabase antes** de publicar (SQL Editor, uma por vez, em ordem).
3. `git push origin main` → a Vercel publica sozinha (~40 s). Confira em **Deployments** que o
   mais novo está **Ready** e com a etiqueta **Current**.
4. Variável de ambiente alterada **só vale depois de um Redeploy**.

### Se o deploy falhar em poucos segundos
Abra o deploy com **Error** e leia a mensagem no topo (ou em **Build Logs**). Caso conhecido:

> *The `CRON_SECRET` environment variable contains characters that are not valid in HTTP
> headers: non-ASCII character…*

O valor tinha acento. Gere outro **só com números e letras**:
`node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`, troque em
**Environment Variables → CRON_SECRET → Edit** e faça **Redeploy**.

Enquanto o deploy novo falha, o site **continua no ar** na última versão que deu certo ("Current").

## 3. Comandos SQL úteis (SQL Editor do Supabase)

Telefone do administrador principal (aparece em "Sobre" e no rodapé):

```sql
update profiles set phone = '19974230904'
where id = (select id from auth.users where email = 'chrysstoreapp@gmail.com');
```

Promover alguém a administrador (a conta precisa existir e estar confirmada; máximo de 3):

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'email@exemplo.com');
```

Confirmar manualmente o e-mail de um usuário (quando o e-mail do Supabase não chegar):

```sql
update auth.users set email_confirmed_at = now() where email = 'email@exemplo.com';
```

Definir uma senha direto no banco (emergência; troque depois em **Minha conta**):

```sql
update auth.users
set encrypted_password = extensions.crypt('NovaSenha123', extensions.gen_salt('bf'))
where email = 'email@exemplo.com';
```

Limpar a auditoria, **mantendo os cancelamentos de pedido** (irreversível — veja antes):

```sql
select action, count(*) from audit_log group by action order by count(*) desc;
delete from audit_log where action <> 'cancel_order';
```

Apagar pedidos de teste devolvendo o estoque (só se **todos** forem de teste):

```sql
begin;
update product_variants v set stock_quantity = v.stock_quantity + r.qtd
from (
  select oi.variant_id, sum(oi.quantity) as qtd
  from order_items oi join orders o on o.id = oi.order_id
  where o.status = 'aguardando_pagamento' and oi.variant_id is not null
  group by oi.variant_id
) r where v.id = r.variant_id;
delete from orders;
delete from order_number_counters;
commit;
```

## 4. Painel: o que cada tela faz

- **Pedidos** → abrir o pedido: confirmar/recusar Pix, marcar como enviado, **cancelar** (justificativa
  obrigatória; registra nome, data/hora e motivo). Cancelar **não devolve o dinheiro** de pedido pago:
  o reembolso é manual.
- **Mensagens** → mensagens do Fale Conosco, com o resultado do envio por e-mail.
- **Administradores** (só o principal) → adicionar/remover/trocar o principal.
- **Configurações → Frete** → CEP/coordenadas da loja, faixas de distância (R$ 0,00 a R$ 50,00) e valor do
  motoboy. A distância é em **linha reta**, por CEP (AwesomeAPI) ou pela rua (OpenStreetMap); se não for
  possível calcular, vale a taxa da faixa mais distante (nunca "grátis" por engano).
- **Cupons** → nome (≤ 10), código (≤ 15), teto de 30% do valor dos produtos, uso único por cliente.
- **Visão geral → Online agora** → abas abertas por área do site (anônimo).

## 5. E-mails

O Resend em **modo de teste** (remetente `onboarding@resend.dev`) só entrega ao e-mail da conta Resend.
Por isso:

- a conta Resend precisa ser a de **`chrysstoreapp@gmail.com`** e a `RESEND_API_KEY` da Vercel precisa ser
  a chave **dessa** conta;
- **clientes não recebem e-mails** até haver domínio próprio.

Diagnóstico pelo painel **Mensagens** (cada mensagem mostra "E-mail enviado para…" ou o **Motivo**):

| Motivo exibido | O que significa | O que fazer |
|---|---|---|
| `API key is invalid` | A `RESEND_API_KEY` da Vercel está errada | Gerar chave nova no Resend, colar sem espaços, **Redeploy** |
| `You can only send testing emails to your own email address (…)` | A chave é de uma conta Resend diferente do destinatário | Usar a conta do `chrysstoreapp@gmail.com` (ou verificar um domínio) |
| (outro) | — | Ver **Resend → Emails** e os *Runtime Logs* da Vercel |

Quando houver domínio: registrar o domínio, verificar no Resend (registros DNS), definir `EMAIL_FROM`
(ex.: `Chrys Store <pedidos@seudominio.com.br>`) e configurar o SMTP do Resend em
**Supabase → Authentication → SMTP Settings** (para o e-mail de confirmação de cadastro).

## 6. Agendamento (Cron)

`vercel.json` agenda `GET /api/cron/expire-orders` **1 vez por dia, 06:00 UTC (03:00 em Brasília)** — máximo
do plano gratuito. A rota exige `Authorization: Bearer <CRON_SECRET>`, enviado pela própria Vercel. Ela
expira pedidos vencidos (devolvendo estoque) e envia o lembrete de pagamento. Confira em
**Vercel → Settings → Cron Jobs** (dá para rodar na hora para testar).

## 7. Problemas já vistos e como resolver

| Sintoma | Causa | Solução |
|---|---|---|
| Catálogo vazio / login e cadastro falham | URL ou chave `anon` do Supabase erradas na Vercel (espaço sobrando, `.com` em vez de `.co`) | Recopiar em **Supabase → Project Settings → API**, recadastrar como **Config**, Redeploy |
| Variável `NEXT_PUBLIC_*` não aceita ("Remove the public prefix…") | Foi salva como **Secret** | Apagar e recriar como **Config** |
| Cadastro de cliente falha / e-mail do Supabase não chega | Limite baixo do e-mail embutido do Supabase | Confirmar pelo SQL (§3) ou configurar SMTP com domínio |
| Link do e-mail de confirmação abre `localhost` | Site URL do Supabase não configurado | **Authentication → URL Configuration**: Site URL e Redirect URLs |
| Cores escuras no celular | Modo escuro **forçado** do navegador (ex.: Samsung Internet), que ignora `color-scheme: only light` | Desligar o escurecimento de sites no navegador do aparelho |
| Admin não reconhecido após deploy | Código novo leu coluna de migração ainda não aplicada | Aplicar a migração; só então publicar |
| Carrinho com "99" ou quantidade que dobrava | Defeito antigo (corrigido) de soma repetida carrinho local + conta | Limpar o item e recomeçar |

## 8. Como será a 2ª fase (Mercado Pago) — apenas referência

Não executar até o dono pedir. Passos previstos: criar a aplicação (Checkout Transparente) no Mercado Pago,
cadastrar chave Pix na conta, definir `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`,
cadastrar o webhook `/api/webhooks/mercadopago` (evento Pagamentos), validar no sandbox, e só então
`CARD_PAYMENTS_ENABLED=true` + trocar as credenciais para produção. Os avisos "em breve" do cartão somem sozinhos.

## 9. Pendências conhecidas

- Domínio próprio + Resend (e SMTP do Supabase) — a cargo do dono.
- Teste real de compra Pix — a cargo do dono, depois do deploy.
- Troca de dados da empresa, fotos e preços dos produtos — em até 72 h, antes de divulgar a URL.
- Revisar trechos `[REVISAR]` das páginas legais.
- Testes de integração em banco real nunca foram executados.
- Mercado Pago (2ª fase).
