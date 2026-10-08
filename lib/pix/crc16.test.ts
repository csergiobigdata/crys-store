import { describe, expect, it } from "vitest";
import { crc16ccitt } from "./crc16";

describe("crc16ccitt", () => {
  it("bate com o valor de verificação padrão do CRC-16/CCITT-FALSE para a entrada de referência '123456789'", () => {
    // Vetor de teste padrão (catálogo de CRCs) para CRC-16/CCITT-FALSE:
    // poly=0x1021 init=0xFFFF refin=false refout=false xorout=0x0000, check=0x29B1.
    expect(crc16ccitt("123456789")).toBe("29B1");
  });

  it("com string vazia retorna o valor inicial inalterado (0xFFFF)", () => {
    expect(crc16ccitt("")).toBe("FFFF");
  });

  it("é determinístico para a mesma entrada", () => {
    expect(crc16ccitt("ABC123")).toBe(crc16ccitt("ABC123"));
  });

  it("muda o resultado quando a entrada muda", () => {
    expect(crc16ccitt("ABC123")).not.toBe(crc16ccitt("ABC124"));
  });

  it("sempre retorna 4 dígitos hexadecimais maiúsculos", () => {
    expect(crc16ccitt("qualquer payload de teste")).toMatch(/^[0-9A-F]{4}$/);
  });
});
