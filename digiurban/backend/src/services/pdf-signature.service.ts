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

  // Obter a página especificada
  const pages = pdfDoc.getPages();
  if (position.page < 0 || position.page >= pages.length) {
    throw new Error(`Página ${position.page} não existe no documento`);
  }

  const page = pages[position.page];
  const pageHeight = page.getHeight();

  // Converter coordenadas do sistema de coordenadas do navegador (top-left)
  // para o sistema do PDF (bottom-left)
  const pdfY = pageHeight - position.y - position.height;

  // Carregar fonte
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Desenhar retângulo de fundo
  page.drawRectangle({
    x: position.x,
    y: pdfY,
    width: position.width,
    height: position.height,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Calcular tamanhos de fonte proporcionais
  const fontSize = Math.min(position.height / 6, 10);
  const smallFontSize = fontSize * 0.8;

  // Posição inicial do texto (com margem)
  const textX = position.x + 5;
  let currentY = pdfY + position.height - fontSize - 5;

  // Linha 1: Título "ASSINADO DIGITALMENTE"
  page.drawText('ASSINADO DIGITALMENTE', {
    x: textX,
    y: currentY,
    size: fontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= fontSize + 2;

  // Linha 2: Nome do assinante
  const nameText = `Por: ${signatureInfo.signerName}`;
  page.drawText(nameText, {
    x: textX,
    y: currentY,
    size: smallFontSize,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentY -= smallFontSize + 2;

  // Linha 3: Email
  const emailText = signatureInfo.signerEmail;
  page.drawText(emailText, {
    x: textX,
    y: currentY,
    size: smallFontSize * 0.9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  currentY -= smallFontSize + 2;

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
    size: smallFontSize * 0.9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  currentY -= smallFontSize + 2;

  // Linha 5: Número de série do certificado
  const serialText = `Cert: ${signatureInfo.certificateSerialNumber.substring(0, 20)}...`;
  page.drawText(serialText, {
    x: textX,
    y: currentY,
    size: smallFontSize * 0.8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
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
