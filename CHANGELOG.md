# Changelog

## 1.1.0

- Painel: contador **"Online agora"** na Visão geral (Supabase Realtime), anônimo, com a
  área do site em que cada aba está (catálogo, carrinho, checkout...). Política de
  Privacidade atualizada.

## 1.0.1

- Carrinho: botão de lixeira por produto (exclui só aquele produto) e botão
  "Esvaziar carrinho" disponível apenas para administradores, sempre sobre o
  próprio carrinho.

## 1.0.0 — Primeira fase (Pix manual)

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
