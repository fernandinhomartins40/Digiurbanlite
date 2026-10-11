/**
 * PDF com várias páginas a partir das fotos (JPEG), sem biblioteca: cada página
 * leva uma imagem inteira. O JPEG entra no PDF como está (filtro DCTDecode), então
 * o arquivo fica do tamanho das fotos.
 */

/** Lado maior da página em pontos (A4 = 842 pt) */
const LONG_SIDE_PT = 842;

export interface PdfPageImage {
  jpeg: Uint8Array;
  width: number;
  height: number;
}

export function buildPdf(images: PdfPageImage[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? encoder.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: () => void) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    body();
    push('\nendobj\n');
  };

  // 1 = catálogo, 2 = lista de páginas, depois 3 objetos por página (página, conteúdo, imagem)
  const pageIds = images.map((_, i) => 3 + i * 3);
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  object(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  object(2, () => push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${images.length} >>`));

  images.forEach((image, i) => {
    const pageId = pageIds[i];
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const ratio = image.width / Math.max(image.height, 1);
    const pw = ratio >= 1 ? LONG_SIDE_PT : LONG_SIDE_PT * ratio;
    const ph = ratio >= 1 ? LONG_SIDE_PT / ratio : LONG_SIDE_PT;
    const w = pw.toFixed(2);
    const h = ph.toFixed(2);
    object(pageId, () =>
      push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    );
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    object(contentId, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    object(imageId, () => {
      push(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>\nstream\n`
      );
      push(image.jpeg);
      push('\nendstream');
    });
  });

  const total = 3 + images.length * 3;
  const xref = length;
  let table = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let id = 1; id < total; id += 1) table += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  push(table);
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}
