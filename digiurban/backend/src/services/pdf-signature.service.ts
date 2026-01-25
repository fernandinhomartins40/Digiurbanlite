import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs/promises';

interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SignatureInfo {
  signerName: string;
  signerEmail: string;
  signedAt: Date;
  certificateSerialNumber: string;
}

/**
 * Adiciona uma assinatura visual ao PDF
 * @param pdfPath Caminho do PDF original
 * @param position Posição onde adicionar a assinatura
 * @param signatureInfo Informações da assinatura
 * @returns Buffer do PDF assinado
 */
export async function addVisualSignatureToPdf(
  pdfPath: string,
  position: SignaturePosition,
  signatureInfo: SignatureInfo
): Promise<Buffer> {
  // Ler o PDF original
  const existingPdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Obter a página especificada (frontend envia 1-indexed, converter para 0-indexed)
  const pages = pdfDoc.getPages();
  const pageIndex = position.page - 1; // Converter de 1-indexed para 0-indexed

  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Página ${position.page} não existe no documento (total de ${pages.length} páginas)`);
  }

  const page = pages[pageIndex];
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  // Converter coordenadas proporcionais (0-1) para pixels da página
  const xPixels = position.x * pageWidth;
  const yPixels = position.y * pageHeight;
  const widthPixels = position.width * pageWidth;
  let heightPixels = position.height * pageHeight;

  // Garantir altura mínima de 80 pixels para caber todo o conteúdo
  const minHeight = 80;
  if (heightPixels < minHeight) {
    heightPixels = minHeight;
  }

  // Converter coordenadas do sistema de coordenadas do navegador (top-left)
  // para o sistema do PDF (bottom-left)
  const pdfY = pageHeight - yPixels - heightPixels;

  // Carregar fonte
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Desenhar retângulo de fundo com cor mais visível
  page.drawRectangle({
    x: xPixels,
    y: pdfY,
    width: widthPixels,
    height: heightPixels,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
    color: rgb(0.98, 0.98, 0.98),
  });

  // Calcular tamanhos de fonte (mais legível)
  const fontSize = Math.max(Math.min(heightPixels / 7, 9), 8);
  const smallFontSize = Math.max(fontSize * 0.85, 7);

  // Posição inicial do texto (com margem)
  const textX = xPixels + 5;
  let currentY = pdfY + heightPixels - fontSize - 5;

  // Linha 1: Título "ASSINADO DIGITALMENTE"
  page.drawText('ASSINADO DIGITALMENTE', {
    x: textX,
    y: currentY,
    size: fontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= fontSize + 3;

  // Linha 2: Nome do assinante
  const nameText = `Por: ${signatureInfo.signerName}`;
  page.drawText(nameText, {
    x: textX,
    y: currentY,
    size: smallFontSize,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });
  currentY -= smallFontSize + 3;

  // Linha 3: Email
  const emailText = signatureInfo.signerEmail;
  page.drawText(emailText, {
    x: textX,
    y: currentY,
    size: smallFontSize * 0.95,
    font: font,
    color: rgb(0.15, 0.15, 0.15),
  });
  currentY -= smallFontSize + 3;

  // Linha 4: Data e hora
  const dateText = `Data: ${signatureInfo.signedAt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })}`;
  page.drawText(dateText, {
    x: textX,
    y: currentY,
    size: smallFontSize * 0.95,
    font: font,
    color: rgb(0.15, 0.15, 0.15),
  });
  currentY -= smallFontSize + 3;

  // Linha 5: Número de série do certificado
  const serialText = `Cert: ${signatureInfo.certificateSerialNumber.substring(0, 20)}...`;
  page.drawText(serialText, {
    x: textX,
    y: currentY,
    size: smallFontSize * 0.9,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Salvar o PDF modificado
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Salva o PDF assinado, substituindo o original
 * @param pdfPath Caminho do PDF original
 * @param signedPdfBuffer Buffer do PDF assinado
 */
export async function saveSignedPdf(
  pdfPath: string,
  signedPdfBuffer: Buffer
): Promise<void> {
  await fs.writeFile(pdfPath, signedPdfBuffer);
}
