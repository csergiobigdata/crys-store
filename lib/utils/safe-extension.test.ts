import { describe, expect, it } from "vitest";
import { safeFileExtension } from "./safe-extension";

describe("safeFileExtension", () => {
  it("extrai uma extensão normal em minúsculas", () => {
    expect(safeFileExtension("foto.PNG", "bin")) .toBe("png");
  });

  it("cai no fallback quando não há extensão", () => {
    expect(safeFileExtension("sememextensao", "bin")).toBe("bin");
  });

  it("cai no fallback para um nome com path traversal sem ponto final", () => {
    // split(".").pop() ingênuo devolveria "png/../../x" aqui
    expect(safeFileExtension("evil.png/../../x", "bin")).toBe("bin");
  });

  it("cai no fallback quando a 'extensão' tem caracteres não alfanuméricos", () => {
    expect(safeFileExtension("arquivo.tar.gz-2", "bin")).toBe("bin");
  });

  it("cai no fallback para uma extensão absurdamente longa", () => {
    expect(safeFileExtension(`arquivo.${"a".repeat(50)}`, "bin")).toBe("bin");
  });
});
