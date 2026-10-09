import { describe, expect, it } from "vitest";
import { areaFromPath, isTrackedPath, summarizePresence } from "./presence";

describe("areaFromPath", () => {
  it("converte o caminho em uma área genérica", () => {
    expect(areaFromPath("/")).toBe("inicio");
    expect(areaFromPath("/catalogo")).toBe("catalogo");
    expect(areaFromPath("/produto/chaveirinho-1-real")).toBe("produto");
    expect(areaFromPath("/carrinho")).toBe("carrinho");
    expect(areaFromPath("/checkout")).toBe("checkout");
    expect(areaFromPath("/pedidos/cs-2026-10-000001")).toBe("pedido");
    expect(areaFromPath("/minha-conta/pedidos")).toBe("conta");
    expect(areaFromPath("/entrar")).toBe("entrar");
    expect(areaFromPath("/termos-de-uso")).toBe("outras");
  });

  it("não depende de parâmetros nem de tokens de pedido", () => {
    // O caminho nunca inclui a query string, e a área não carrega o número do pedido.
    expect(areaFromPath("/pedidos/cs-2026-10-000001")).toBe("pedido");
  });
});

describe("isTrackedPath", () => {
  it("o painel administrativo não entra na contagem", () => {
    expect(isTrackedPath("/admin")).toBe(false);
    expect(isTrackedPath("/admin/pedidos")).toBe(false);
    expect(isTrackedPath("/catalogo")).toBe(true);
  });
});

describe("summarizePresence", () => {
  it("conta uma aba por chave e soma por área", () => {
    const summary = summarizePresence({
      a: [{ area: "catalogo", logged: false }],
      b: [{ area: "checkout", logged: true }],
      c: [{ area: "catalogo", logged: true }],
    });
    expect(summary.total).toBe(3);
    expect(summary.logged).toBe(2);
    expect(summary.byArea).toEqual({ catalogo: 2, checkout: 1 });
  });

  it("usa a entrada mais recente quando uma aba reentra", () => {
    const summary = summarizePresence({
      a: [
        { area: "catalogo", logged: false },
        { area: "carrinho", logged: false },
      ],
    });
    expect(summary.total).toBe(1);
    expect(summary.byArea).toEqual({ carrinho: 1 });
  });

  it("ninguém online", () => {
    expect(summarizePresence({})).toEqual({ total: 0, logged: 0, byArea: {} });
  });
});
