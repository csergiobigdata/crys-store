import "server-only";
import QRCode from "qrcode";

/** Renderiza o payload Pix como uma imagem QR Code em data URL (PNG base64). */
export async function renderPixQrCode(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}
