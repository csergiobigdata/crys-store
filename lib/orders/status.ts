export const orderStatusLabels: Record<string, string> = {
  criado: "Criado",
  aguardando_pagamento: "Aguardando pagamento",
  em_analise: "Em análise",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "Expirado",
  pagamento_recusado: "Pagamento recusado",
  estornado: "Estornado",
};

export const orderStatusTone: Record<string, "neutral" | "success" | "error" | "warning"> = {
  criado: "neutral",
  aguardando_pagamento: "warning",
  em_analise: "warning",
  pago: "success",
  em_separacao: "success",
  enviado: "success",
  entregue: "success",
  cancelado: "error",
  expirado: "error",
  pagamento_recusado: "error",
  estornado: "error",
};
