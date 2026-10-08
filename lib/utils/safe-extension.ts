/**
 * Extrai uma extensão de arquivo segura do nome original, para compor o
 * caminho no Storage. Nunca usa o nome do arquivo direto: um nome
 * malicioso como "evil.png/../../x" não tem um "." depois da barra, então
 * um split(".").pop() ingênuo devolveria "png/../../x" — um path
 * traversal. Aqui, qualquer coisa fora de [a-z0-9]{1,8} cai no padrão.
 */
export function safeFileExtension(fileName: string, fallback: string): string {
  const rawExtension = fileName.split(".").pop() ?? "";
  const isSafe = /^[a-z0-9]{1,8}$/i.test(rawExtension);
  return isSafe ? rawExtension.toLowerCase() : fallback;
}
