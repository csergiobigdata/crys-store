import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { compressProofForEmail } from "./compress-proof";

/** Imagem parecida com um print de comprovante: fundo liso, texto e faixas. */
async function fakeScreenshotPng() {
  const svg = `
    <svg width="2400" height="3200" xmlns="http://www.w3.org/2000/svg">
      <rect width="2400" height="3200" fill="#ffffff"/>
      <rect x="0" y="0" width="2400" height="400" fill="#7a1fa2"/>
      <text x="120" y="700" font-size="120" fill="#222">Comprovante de Pix</text>
      <text x="120" y="900" font-size="90" fill="#444">Valor: R$ 22,90</text>
      <text x="120" y="1100" font-size="90" fill="#444">Para: CARLOS SERGIO</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 0 }).toBuffer();
}

describe("compressProofForEmail", () => {
  it("reduz um print grande e fica no máximo com 1600 px de lado", async () => {
    const original = await fakeScreenshotPng();
    const result = await compressProofForEmail(original, "image/png", "comprovante-teste");

    expect(result.content.length).toBeLessThan(original.length);
    expect(result.originalSize).toBe(original.length);
    expect(["image/webp", "image/jpeg", "image/png"]).toContain(result.contentType);

    const meta = await sharp(result.content).metadata();
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(1600);
  });

  it("o nome do arquivo acompanha o formato escolhido", async () => {
    const original = await fakeScreenshotPng();
    const result = await compressProofForEmail(original, "image/png", "comprovante-x");
    const extension = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" }[
      result.contentType as "image/webp" | "image/jpeg" | "image/png"
    ];
    expect(result.filename).toBe(`comprovante-x.${extension}`);
  });

  it("PDF segue sem alteração", async () => {
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n");
    const result = await compressProofForEmail(pdf, "application/pdf", "comprovante-y");
    expect(result.content).toBe(pdf);
    expect(result.filename).toBe("comprovante-y.pdf");
    expect(result.contentType).toBe("application/pdf");
  });

  it("arquivo de imagem corrompido volta como o original (nunca quebra o envio)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = Buffer.from("isto nao e uma imagem");
    const result = await compressProofForEmail(broken, "image/jpeg", "comprovante-z");
    expect(result.content).toBe(broken);
    expect(result.filename).toBe("comprovante-z.jpg");
  });
});
