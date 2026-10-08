/**
 * CRC16-CCITT (CRC-16/CCITT-FALSE): polinômio 0x1021, valor inicial 0xFFFF,
 * sem reflexão de entrada/saída, sem XOR final — exatamente como exigido
 * pelo campo 63 do BR Code (EMV Pix).
 */
export function crc16ccitt(payload: string): string {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}
