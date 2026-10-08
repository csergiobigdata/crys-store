/**
 * O BR Code (EMV Pix) exige texto ASCII simples nos campos 59 (nome) e 60
 * (cidade) — sem acentos, dentro do limite de caracteres de cada campo.
 */
export function sanitizePixText(value: string, maxLength: number): string {
  const ascii = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase();

  return ascii.slice(0, maxLength).trim();
}

/** txid do campo 62/05: até 25 caracteres alfanuméricos, sem espaços ou símbolos. */
export function sanitizeTxid(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, 25).toUpperCase();
}
