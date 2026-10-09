# Changelog

> **A versão do aplicativo é fixa em 1.2.0** (exibida em "Sobre"). Por decisão do
> dono do projeto, ela não muda a cada deploy: as mudanças novas entram na seção
> abaixo, sem trocar o número. A constante está em `lib/app-version.ts`.

## 1.2.0 (versão atual) — alterações mais recentes

- "Esqueci minha senha": link no login, e-mail com link de uso único (1 hora) enviado pelo
  Resend e página para criar a nova senha.
- Expiração automática de pedidos pelo Vercel Cron (`vercel.json`), uma vez por dia.
- Versão fixa do aplicativo em 1.2.0.

## Histórico anterior (numeração antiga, antes de a versão ficar fixa)

### 1.2.0 (filtro de palavrões)

- Fale Conosco: filtro de palavrões e ofensas na mensagem (aviso na hora, envio bloqueado no
  navegador e conferido de novo no servidor).

### 1.1.2

- Fale Conosco: um e-mail por administrador (se o provedor recusar um endereço, os outros ainda
  recebem) e o painel de Mensagens mostra para quem foi enviado ou o motivo da falha.

### 1.1.1

- Celulares: a loja declara tema claro único (`color-scheme: only light`), para o navegador não
  escurecer as cores automaticamente.

### 1.1.0

- Painel: contador **"Online agora"** na Visão geral (Supabase Realtime), anônimo, com a
  área do site em que cada aba está (catálogo, carrinho, checkout...). Política de
  Privacidade atualizada.

### 1.0.1

- Carrinho: botão de lixeira por produto (exclui só aquele produto) e botão
  "Esvaziar carrinho" disponível apenas para administradores, sempre sobre o
  próprio carrinho.

### 1.0.0 — Primeira fase (Pix manual)

Versão final da 1ª fase da Chrys Store. Pagamento por **Pix** (estático com
comprovante e confirmação pelo administrador; Pix automático via Mercado Pago
já implementado e ativado pelas credenciais). Cartão (Mercado Pago) fica para
a 2ª fase (`CARD_PAYMENTS_ENABLED`).

### Loja
- Catálogo, carrinho rápido (quantidade digitável, sem esperar o servidor) e checkout.
- Frete: Correios (PAC, SEDEX, Mini Envios), entrega local por faixa de distância
  e motoboy (taxas de R$ 0,00 a R$ 50,00 definidas pelo administrador),
  "Entrega local — a combinar com a loja".
- Cupons com nome (até 10 caracteres), código (até 15), teto de 30% de desconto
  e uso único por cliente; desconto mostrado no checkout ao aplicar.
- Envio de comprovante Pix com seletor (clicar/arrastar, pré-visualização).
- Páginas legais, "Sobre" (logomarca, versão e contato do administrador principal)
  e **Fale Conosco** (mensagem enviada a todos os administradores e guardada no painel).

### Painel administrativo
- Produtos (com marca de produto de teste), categorias (máximo de 10), cupons, pedidos
  (cancelamento com justificativa, quem, data e hora), relatórios, auditoria e configurações.
- Até **3 administradores**; o **principal** gerencia a lista e o contato dele é o
  contato público da loja.
- Caixa de **Mensagens** do Fale Conosco.

### Banco de dados
Migrações `0001` a `0025` em `supabase/migrations/`.
