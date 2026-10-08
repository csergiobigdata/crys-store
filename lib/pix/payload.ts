import { crc16ccitt } from "@/lib/pix/crc16";
import { sanitizePixText, sanitizeTxid } from "@/lib/pix/text";

export type PixPayloadInput = {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid: string;
};

/** Monta um campo TLV: 2 dígitos de ID + 2 dígitos de tamanho + valor. */
function field(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/**
 * Gera o payload BR Code (EMV) completo para Pix com valor fixo, seguindo
 * exatamente os campos do item 5.1 da especificação. O valor é sempre o
 * total do pedido calculado no servidor — nunca um valor vindo do cliente.
 */
export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid,
}: PixPayloadInput): string {
  const merchantAccountInfo = field("00", "br.gov.bcb.pix") + field("01", pixKey);

  const additionalDataField = field("05", sanitizeTxid(txid));

  const payloadWithoutCrc =
    field("00", "01") +
    field("26", merchantAccountInfo) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount.toFixed(2)) +
    field("58", "BR") +
    field("59", sanitizePixText(merchantName, 25)) +
    field("60", sanitizePixText(merchantCity, 15)) +
    field("62", additionalDataField) +
    "6304";

  return payloadWithoutCrc + crc16ccitt(payloadWithoutCrc);
}

export type DecodedPixField = { id: string; value: string };

/** Quebra um payload BR Code em seus campos TLV — usado pelos testes. */
export function decodePixPayload(payload: string): DecodedPixField[] {
  const fields: DecodedPixField[] = [];
  let index = 0;

  while (index < payload.length) {
    const id = payload.slice(index, index + 2);
    const length = Number(payload.slice(index + 2, index + 4));
    const value = payload.slice(index + 4, index + 4 + length);
    fields.push({ id, value });
    index += 4 + length;
  }

  return fields;
}
