/**
 * E-mails são HTML construído por interpolação de string (não passam pelo
 * escape automático do React). Qualquer valor que venha de entrada do
 * usuário (nome no checkout, código de rastreio digitado pelo admin, etc.)
 * precisa passar por aqui antes de entrar no template.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
