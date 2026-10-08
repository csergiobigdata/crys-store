import "server-only";

/**
 * Pagamento por cartão (Mercado Pago) só fica disponível quando
 * CARD_PAYMENTS_ENABLED=true. Enquanto estiver desligado, o checkout oferece
 * apenas Pix e o servidor recusa pedidos com cartão.
 */
export function isCardPaymentEnabled(): boolean {
  return process.env.CARD_PAYMENTS_ENABLED === "true";
}
