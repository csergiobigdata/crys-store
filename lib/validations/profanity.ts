/**
 * Filtro simples de palavrões e ofensas em português, usado no Fale Conosco.
 * Roda no servidor (decisão final) e no navegador (aviso na hora, sem esperar).
 *
 * Como evita erros comuns de filtros:
 * - compara PALAVRAS inteiras (não pedaços): "cuidado", "curso" ou "putativo" passam;
 * - ignora acentos, maiúsculas e letras repetidas ("puuuta", "PÔRRA");
 * - entende trocas por números e símbolos ("p0rr4", "m3rd@");
 * - pega letras separadas ("p u t a", "p.u.t.a").
 * Palavras ambíguas do dia a dia da loja (ex.: "piranha", o prendedor de cabelo)
 * ficam de fora de propósito. Nenhum filtro é perfeito: ele barra o óbvio.
 */

// Formas completas (comparação exata, já sem acento e em minúsculas).
const EXACT_WORDS = new Set([
  "puta", "putas", "puto", "putos", "putaria", "putinha", "putao", "putona",
  "porra", "porras", "porrada",
  "merda", "merdas", "merdinha", "merdao",
  "bosta", "bostinha",
  "cacete",
  "foda", "fodase", "foder", "fodida", "fodido", "fodidos", "fodendo", "fodeu",
  "cu", "cuzao", "cuzinho", "cus",
  "viado", "viadinho", "viada", "viados",
  "bicha", "sapatao",
  "vagabunda", "vagabundo", "vagabundas", "vagabundos",
  "safada", "safado",
  "babaca", "babacas",
  "idiota", "idiotas", "imbecil", "imbecis", "otario", "otaria", "otarios", "cretino", "cretina",
  "retardado", "retardada", "desgracado", "desgracada", "desgracados",
  "corno", "corna", "cornudo",
  "tarado", "tarada", "crioulo", "crioula",
  "fdp", "vsf", "tnc", "vtnc", "pqp", "vtnc", "krl", "crl",
]);

// Radicais longos: pegam variações ("caralhada", "arrombadinho", "punheteiro").
const STEMS = [
  "caralh",
  "buceta",
  "boceta",
  "xoxota",
  "arrombad",
  "punhet",
  "vagabund",
  "desgracad",
  "filhodaput",
];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

/** Minúsculas, sem acentos, números/símbolos trocados por letras e letras repetidas reduzidas. */
function normalize(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[013457@$]/g, (char) => LEET[char] ?? char);
  // 3 ou mais letras iguais seguidas viram uma só ("puuuuta" -> "puta").
  return base.replace(/([a-z])\1{2,}/g, "$1");
}

/** Junta sequências de letras soltas ("p u t a", "p.u.t.a") em uma palavra. */
function joinSpacedLetters(text: string): string[] {
  const joined: string[] = [];
  const pattern = /(?:^|[^a-z])((?:[a-z][\s.\-_*]+){2,}[a-z])(?![a-z])/g;
  for (const match of text.matchAll(pattern)) {
    joined.push(match[1].replace(/[^a-z]/g, ""));
  }
  return joined;
}

/** `true` se o texto contém palavrão ou ofensa. */
export function containsOffensiveLanguage(text: string): boolean {
  if (!text) return false;
  const normalized = normalize(text);

  const tokens = [...normalized.split(/[^a-z]+/).filter(Boolean), ...joinSpacedLetters(normalized)];

  for (const token of tokens) {
    if (EXACT_WORDS.has(token)) return true;
    if (STEMS.some((stem) => token.startsWith(stem))) return true;
  }

  // Letras separadas por símbolos no meio da palavra ("ca-ra-lho", "ca ra lho").
  const squashed = normalized.replace(/[^a-z]/g, "");
  return STEMS.some((stem) => stem.length >= 6 && squashed.includes(stem));
}

export const OFFENSIVE_LANGUAGE_MESSAGE =
  "Sua mensagem contém palavras ofensivas. Reescreva-a de forma respeitosa para poder enviá-la.";
