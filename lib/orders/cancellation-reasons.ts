/**
 * Justificativas de cancelamento oferecidas ao administrador (as mais comuns
 * no comércio eletrônico). Fica em um arquivo sem "use server" para poder ser
 * importado tanto pelo formulário (cliente) quanto pela Server Action.
 */
export const CANCELLATION_REASONS = [
  { code: "cliente_desistiu", label: "Cliente desistiu da compra" },
  { code: "arrependimento", label: "Direito de arrependimento (CDC, 7 dias)" },
  { code: "pagamento_nao_identificado", label: "Pagamento não identificado" },
  { code: "pagamento_vencido", label: "Prazo de pagamento vencido" },
  { code: "suspeita_fraude", label: "Suspeita de fraude" },
  { code: "sem_estoque", label: "Produto indisponível / sem estoque" },
  { code: "erro_preco", label: "Erro de preço ou de cadastro do produto" },
  { code: "pedido_duplicado", label: "Pedido duplicado" },
  { code: "endereco_incorreto", label: "Dados ou endereço de entrega incorretos" },
  { code: "fora_area_entrega", label: "Endereço fora da área de entrega" },
  { code: "pedido_teste", label: "Pedido de teste" },
  { code: "outro", label: "Outro motivo (descreva abaixo)" },
] as const;

export type CancellationReasonCode = (typeof CANCELLATION_REASONS)[number]["code"];

export function getCancellationReasonLabel(code: string): string | null {
  return CANCELLATION_REASONS.find((reason) => reason.code === code)?.label ?? null;
}
