import { describe, expect, it } from "vitest";
import { formatCep, formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("formata em Real brasileiro", () => {
    expect(formatCurrency(189.9)).toBe("R$ 189,90");
  });

  it("formata zero corretamente", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });
});

describe("formatCep", () => {
  it("adiciona o hífen em um CEP de 8 dígitos", () => {
    expect(formatCep("01310100")).toBe("01310-100");
  });

  it("mantém o valor original se não tiver 8 dígitos", () => {
    expect(formatCep("123")).toBe("123");
  });
});

describe("formatDateTimeSeconds", () => {
  it("formata em dd/mm/aaaa hh:mm:ss no horário de Brasília", async () => {
    const { formatDateTimeSeconds } = await import("@/lib/utils/format");
    // 2026-10-09 08:05:03 UTC = 05:05:03 em Brasília (UTC-3)
    expect(formatDateTimeSeconds("2026-10-09T08:05:03Z")).toBe("09/10/2026 05:05:03");
    // meia-noite em 24h deve ser 00, não 24
    expect(formatDateTimeSeconds("2026-10-09T03:00:00Z")).toBe("09/10/2026 00:00:00");
  });
});

describe("formatDateTime e formatDate", () => {
  it("usam o horário de Brasília, não o do servidor (UTC)", async () => {
    const { formatDate, formatDateTime } = await import("@/lib/utils/format");
    // 05:10 UTC = 02:10 em Brasília
    expect(formatDateTime("2026-10-09T05:10:35Z")).toBe("09/10/2026 02:10");
    // 01:00 UTC ainda é o dia anterior em Brasília
    expect(formatDate("2026-10-09T01:00:00Z")).toBe("08/10/2026");
  });
});
