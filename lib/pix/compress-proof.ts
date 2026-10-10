import "server-only";
import sharp from "sharp";

export type CompressedProof = {
  content: Buffer;
  filename: string;
  contentType: string;
  originalSize: number;
};

/** Lado máximo da imagem enviada por e-mail: ainda dá para ler o comprovante com folga. */
const MAX_SIDE = 1600;

const EXTENSION_BY_FORMAT = { webp: "webp", jpeg: "jpg", png: "png" } as const;
const CONTENT_TYPE_BY_FORMAT = {
  webp: "image/webp",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

type Format = keyof typeof EXTENSION_BY_FORMAT;

function formatOf(contentType: string): Format | null {
  if (contentType === "image/jpeg") return "jpeg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return null;
}

/**
 * Prepara o comprovante para ir ANEXADO ao e-mail do administrador, ocupando o
 * menor espaço possível sem perder a leitura:
 * - imagens: reduz para no máx. 1600 px, e testa WebP, JPEG e PNG otimizados,
 *   ficando com o MENOR arquivo (ou com o original, se ele já for o menor);
 * - PDF: segue como está (não há como reduzi-lo sem ferramentas pesadas).
 * O arquivo original continua guardado, intacto, no sistema (Supabase Storage).
 */
export async function compressProofForEmail(
  original: Buffer,
  contentType: string,
  baseName: string,
): Promise<CompressedProof> {
  const originalFormat = formatOf(contentType);

  if (!originalFormat) {
    // PDF (ou outro tipo aceito): anexa sem alterar.
    return {
      content: original,
      filename: `${baseName}.pdf`,
      contentType,
      originalSize: original.length,
    };
  }

  const untouched: CompressedProof = {
    content: original,
    filename: `${baseName}.${EXTENSION_BY_FORMAT[originalFormat]}`,
    contentType,
    originalSize: original.length,
  };

  try {
    // .rotate() aplica a orientação da câmera (EXIF) antes de reduzir.
    const base = () =>
      sharp(original, { failOn: "none" })
        .rotate()
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true });

    const candidates = await Promise.all([
      base()
        .webp({ quality: 78, effort: 6 })
        .toBuffer()
        .then((content) => ({ format: "webp" as Format, content })),
      base()
        .jpeg({ quality: 74, mozjpeg: true })
        .toBuffer()
        .then((content) => ({ format: "jpeg" as Format, content })),
      base()
        .png({ palette: true, quality: 70, effort: 10 })
        .toBuffer()
        .then((content) => ({ format: "png" as Format, content })),
    ]);

    const best = candidates.reduce((smallest, candidate) =>
      candidate.content.length < smallest.content.length ? candidate : smallest,
    );

    if (best.content.length >= original.length) return untouched;

    return {
      content: best.content,
      filename: `${baseName}.${EXTENSION_BY_FORMAT[best.format]}`,
      contentType: CONTENT_TYPE_BY_FORMAT[best.format],
      originalSize: original.length,
    };
  } catch (error) {
    console.error("Não foi possível reduzir o comprovante; segue o original:", error);
    return untouched;
  }
}
