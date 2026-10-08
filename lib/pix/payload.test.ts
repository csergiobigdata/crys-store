import { describe, expect, it } from "vitest";
import { crc16ccitt } from "./crc16";
import { buildPixPayload, decodePixPayload } from "./payload";

const baseInput = {
  pixKey: "11999999999",
  merchantName: "Chrys Store",
  merchantCity: "Sao Paulo",
  amount: 189.9,
  txid: "CS202500012",
};

describe("buildPixPayload", () => {
  it("gera um CRC embutido igual ao recalculado de forma independente", () => {
    const payload = buildPixPayload(baseInput);
    const withoutCrc = payload.slice(0, -4);
    const embeddedCrc = payload.slice(-4);
    expect(embeddedCrc).toBe(crc16ccitt(withoutCrc));
  });

  it("contém exatamente os campos exigidos pela especificação, na ordem", () => {
    const fields = decodePixPayload(buildPixPayload(baseInput));
    expect(fields.map((f) => f.id)).toEqual([
      "00",
      "26",
      "52",
      "53",
      "54",
      "58",
      "59",
      "60",
      "62",
      "63",
    ]);
  });

  it("o payload é totalmente reconstruível a partir dos campos decodificados", () => {
    const payload = buildPixPayload(baseInput);
    const rebuilt = decodePixPayload(payload)
      .map((f) => `${f.id}${f.value.length.toString().padStart(2, "0")}${f.value}`)
      .join("");
    expect(rebuilt).toBe(payload);
  });

  it("usa os valores fixos exigidos: indicador, categoria, moeda e país", () => {
    const fields = decodePixPayload(buildPixPayload(baseInput));
    const byId = Object.fromEntries(fields.map((f) => [f.id, f.value]));
    expect(byId["00"]).toBe("01");
    expect(byId["52"]).toBe("0000");
    expect(byId["53"]).toBe("986");
    expect(byId["58"]).toBe("BR");
  });

  it("usa o valor do pedido formatado com duas casas decimais no campo 54", () => {
    const fields = decodePixPayload(buildPixPayload(baseInput));
    expect(fields.find((f) => f.id === "54")?.value).toBe("189.90");
  });

  it("inclui o GUI br.gov.bcb.pix e a chave Pix dentro do campo 26", () => {
    const fields = decodePixPayload(buildPixPayload(baseInput));
    const merchantAccountValue = fields.find((f) => f.id === "26")?.value ?? "";
    const subfields = decodePixPayload(merchantAccountValue);
    expect(subfields.find((f) => f.id === "00")?.value).toBe("br.gov.bcb.pix");
    expect(subfields.find((f) => f.id === "01")?.value).toBe(baseInput.pixKey);
  });

  it("remove acentos e trunca nome e cidade do recebedor nos limites do BR Code", () => {
    const fields = decodePixPayload(
      buildPixPayload({
        ...baseInput,
        merchantName: "Loja da Chrystiane Acessórios Finos",
        merchantCity: "São Paulo",
      }),
    );
    const name = fields.find((f) => f.id === "59")?.value ?? "";
    const city = fields.find((f) => f.id === "60")?.value ?? "";

    expect(name.length).toBeLessThanOrEqual(25);
    expect(city.length).toBeLessThanOrEqual(15);
    expect(name).not.toMatch(/[ÁÉÍÓÚÃÕÇáéíóúãõç]/);
    expect(city).toBe("SAO PAULO");
  });

  it("limita o txid (campo 62/05) a caracteres alfanuméricos, até 25 chars", () => {
    const fields = decodePixPayload(
      buildPixPayload({ ...baseInput, txid: "cs-2025-00012!!! extra chars here" }),
    );
    const additionalData = fields.find((f) => f.id === "62")?.value ?? "";
    const txidField = decodePixPayload(additionalData).find((f) => f.id === "05");
    expect(txidField?.value).toMatch(/^[A-Z0-9]{1,25}$/);
  });
});
