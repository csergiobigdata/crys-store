import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";
import { containsOffensiveLanguage } from "./profanity";

describe("containsOffensiveLanguage", () => {
  it("pega palavrões comuns, com acento, caixa e pontuação", () => {
    expect(containsOffensiveLanguage("Isso é uma PORRA!")).toBe(true);
    expect(containsOffensiveLanguage("que merda de atendimento")).toBe(true);
    expect(containsOffensiveLanguage("vai se foder")).toBe(true);
    expect(containsOffensiveLanguage("Vocês são uns babacas.")).toBe(true);
    expect(containsOffensiveLanguage("filho da puta")).toBe(true);
  });

  it("pega variações, letras repetidas, números e símbolos no lugar de letras", () => {
    expect(containsOffensiveLanguage("puuuuta")).toBe(true);
    expect(containsOffensiveLanguage("p0rr4")).toBe(true);
    expect(containsOffensiveLanguage("m3rd@")).toBe(true);
    expect(containsOffensiveLanguage("caralhada")).toBe(true);
  });

  it("pega letras separadas", () => {
    expect(containsOffensiveLanguage("p u t a")).toBe(true);
    expect(containsOffensiveLanguage("p.u.t.a")).toBe(true);
    expect(containsOffensiveLanguage("ca-ra-lho")).toBe(true);
  });

  it("não barra palavras normais que só PARECEM palavrões", () => {
    const harmless = [
      "Gostaria de saber o prazo de entrega.",
      "Cuidado com o frete, por favor",
      "Qual o curso de montagem do kit?",
      "culpa minha, errei o número do pedido",
      "O argumento putativo da loja",
      "Tem a piranha de cabelo na cor rosa?",
      "Os anéis são banhados à prata?",
      "Quero 2 unidades do pedido 1234",
      "Obrigada, a pulseira é linda!",
      "Computador, classe, assassino, escultura, capacete",
    ];
    for (const text of harmless) {
      expect(containsOffensiveLanguage(text), text).toBe(false);
    }
  });

  it("texto vazio é aceito", () => {
    expect(containsOffensiveLanguage("")).toBe(false);
  });
});

describe("contactSchema + filtro", () => {
  const base = { name: "Maria Souza", email: "maria@exemplo.com" };

  it("recusa mensagem com ofensa", () => {
    const result = contactSchema.safeParse({
      ...base,
      message: "Que atendimento de merda, vocês não respondem.",
    });
    expect(result.success).toBe(false);
  });

  it("aceita mensagem respeitosa", () => {
    const result = contactSchema.safeParse({
      ...base,
      message: "Gostaria de saber se há desconto para compras em maior quantidade.",
    });
    expect(result.success).toBe(true);
  });
});
