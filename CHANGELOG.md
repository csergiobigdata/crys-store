# Changelog

> **A versão do aplicativo é fixa em 1.3.0** (exibida em "Sobre"). Por decisão do
> dono do projeto, ela não muda a cada deploy: as mudanças novas entram na seção
> abaixo, sem trocar o número. A constante está em `lib/app-version.ts`.

## 1.3.0 (versão atual) — alterações mais recentes

- Nova seção **Vendas** no painel (`/admin/vendas`): lista só os pedidos com pagamento confirmado (pago, em separação, enviado, entregue), com filtro por período e forma de pagamento, total vendido e quem/quando confirmou. Em **Pedidos**, os confirmados ganham a etiqueta "Pagamento confirmado" (e filtro próprio), e os Pix pendentes têm o botão "Confirmar pagamento". A antiga seção "Vendas" das Configurações passou a se chamar "Pausa de vendas".
- E-mail ao administrador a cada compra (Pix ou cartão): dados do cliente (nome, e-mail, telefone,
  CPF), produtos com quantidade e valores, frete, desconto, total, forma de pagamento e endereço de
  entrega, com link para o pedido no painel (`notifyAdminNewOrder`). Vai para `ADMIN_NOTIFICATION_EMAIL`.
- Pedidos (admin): "Marcar como pagamento confirmado" agora aceita comprovante anexado pelo
  administrador e observação, ambos opcionais (`confirmPixPaymentManuallyAction`). Vale para Pix em
  "aguardando pagamento" ou "em análise"; avisa o cliente por e-mail e registra na auditoria.
- Login: botão de olho para mostrar/ocultar a senha digitada (`components/ui/password-input.tsx`).
- Meus pedidos: agora lista os produtos de cada pedido, separados em "Pedidos em andamento" e
  "Compras anteriores" (entregue, cancelado, expirado, recusado, estornado).
- Configurações > Vendas: o administrador pode pausar e liberar as vendas a qualquer momento. Pausadas,
  o site mostra um aviso (com Fale Conosco e telefone), o cliente continua navegando, mas não adiciona
  ao carrinho, não abre o checkout e `createOrder` recusa o pedido. Guardado em `app_settings`
  (chave `sales_paused`); registrado na auditoria. Pedidos já criados ainda podem ser pagos.
- Painel administrativo: o card "Pedidos ativos" passa a contar só os pedidos que não foram
  cancelados (antes contava todos).
- Sessão por inatividade: depois de 15 minutos sem mouse, teclado, rolagem ou toque, o usuário
  logado (cliente ou administrador) é desconectado e volta ao login, com aviso. A atividade vale
  para todas as abas abertas (`components/site/idle-logout.tsx`, ação `logoutIdle`).
- Auditoria: novo módulo "Apagar o log de auditoria" (só administrador principal), com janela de
  confirmação que exige digitar APAGAR. Fica gravado um único registro dizendo quem apagou e quantos
  registros existiam (`lib/admin/audit-actions.ts`, `components/admin/clear-audit-log.tsx`).
- Configurações: o "Nome do recebedor" do Pix aceita até 100 caracteres (antes 25). O QR Code/copia e
  cola continua limitado a 25 pelo padrão do Pix: o app corta o nome só dentro do código, sem acentos.
- Nova página de **Ajuda** (`/ajuda`): perguntas e respostas sobre compra, pagamento, entrega e conta,
  e uma seção extra "Para administradores" visível só a quem é admin. Link no rodapé, na seção Atendimento.
- Cabeçalho: "Todos os produtos" ganhou visual de botão discreto, com ícone (só desktop).
- Versão do aplicativo atualizada de 1.2.0 para 1.3.0 a pedido do dono (continua fixa).

## 1.2.0 — versão anterior

- Documentação revista: `README.md` reescrito, novo `docs/operacao.md` (guia de operação) e
  capítulo 7 em `docs/arquitetura.md` com tudo o que mudou desde a especificação.
- Removido o workflow `.github/workflows/expire-orders.yml` (GitHub Actions, a cada 15 min): foi substituído pelo
  Vercel Cron e, sem os secrets configurados, falharia a cada execução.
- `.env.example`: aviso de que `CRON_SECRET` deve ser só ASCII (causa de falhas de deploy já vista).
- "Esqueci minha senha": link no login, e-mail com link de uso único (1 hora) enviado pelo
  Resend e página para criar a nova senha.
- Expiração automática de pedidos pelo Vercel Cron (`vercel.json`), uma vez por dia.
- Versão fixa do aplicativo em 1.2.0 (depois atualizada para 1.3.0).
- Comprovante Pix: o e-mail ao administrador leva o arquivo anexado, reduzido ao menor tamanho
  (imagem até 1600 px em WebP/JPEG/PNG, o que ficar menor; PDF segue igual). O original fica
  guardado no painel.
- Cartão em até 6x: enquanto `CARD_PAYMENTS_ENABLED` não for ligado, a página inicial, o checkout e
  os Termos avisam que o cartão ainda não está liberado e que em breve estará.
- Login: depois de entrar, abre a página inicial (e não mais "Minha conta"); o redirecionamento
  só aceita caminhos do próprio site.

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
