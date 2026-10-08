import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("escapa tags HTML para impedir injeção em e-mails", () => {
    expect(escapeHtml("<img src=x onerror=alert(1)>")).toBe(
      "&lt;img src=x onerror=alert(1)&gt;",
    );
  });

  it("escapa aspas e & corretamente", () => {
    expect(escapeHtml(`O'Brien & "Cia"`)).toBe("O&#39;Brien &amp; &quot;Cia&quot;");
  });

  it("não altera texto sem caracteres especiais", () => {
    expect(escapeHtml("Maria Souza")).toBe("Maria Souza");
  });
});
