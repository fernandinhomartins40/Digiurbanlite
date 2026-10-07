/**
 * PDF assinado = o original (intacto) + "Folha de assinaturas" (quem assinou,
 * quando, código de cada assinatura, QR Code da conferência) + selo digital do
 * município (assinatura PDF que leitores como o Adobe mostram).
 *
 * O original nunca é alterado: a assinatura de cada pessoa vale sobre o
 * conteúdo dele (hash SHA-256), então várias pessoas podem assinar sem uma
 * invalidar a outra. O selo fecha o arquivo final (qualquer mudança aparece).
 */

import * as forge from 'node-forge';
import QRCode from 'qrcode';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';
import { issueCertificate, loadSigningKey } from '../certificate-authority.service';
import { getPlatformCA } from './keystore.service';

export interface ManifestSignature {
  name: string;
  role?: string | null;
  signedAt: Date;
  code: string;
}

export interface ManifestInfo {
  municipality: string;
  title: string;
  /** código para conferir o documento (vai no QR) */
  verifyCode: string;
  verifyUrl: string;
  contentHash: string;
  signatures: ManifestSignature[];
}

/** pdf-lib (fontes padrão) só escreve Latin-1: troca o resto por equivalentes */
function latin(text: string): string {
  return String(text ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of latin(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

const brasilia = (date: Date) =>
  date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Acrescenta a folha de assinaturas ao fim do PDF */
export async function appendManifest(original: Buffer, info: ManifestInfo): Promise<Buffer> {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qrPng = await QRCode.toBuffer(info.verifyUrl, { margin: 1, width: 220 });
  const qr = await pdf.embedPng(qrPng);

  const W = 595.28;
  const H = 841.89;
  const M = 48;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (value: string, opts: { size?: number; f?: PDFFont; color?: [number, number, number]; x?: number; width?: number } = {}) => {
    const size = opts.size || 10;
    const f = opts.f || font;
    for (const line of wrap(value, f, size, opts.width || W - 2 * M)) {
      if (y < M + 20) {
        page = pdf.addPage([W, H]);
        y = H - M;
      }
      page.drawText(line, { x: opts.x ?? M, y, size, font: f, color: rgb(...(opts.color || [0.1, 0.1, 0.1])) });
      y -= size + 4;
    }
  };

  text(info.municipality, { size: 10, color: [0.35, 0.35, 0.35] });
  y -= 4;
  text('FOLHA DE ASSINATURAS', { size: 15, f: bold });
  y -= 2;
  text(info.title, { size: 11, width: W - 2 * M - 130 });
  y -= 6;

  // QR à direita do cabeçalho
  page.drawImage(qr, { x: W - M - 110, y: H - M - 115, width: 110, height: 110 });
  y = Math.min(y, H - M - 125);

  text(`Para conferir: acesse ${info.verifyUrl} ou leia o QR Code. Código: ${info.verifyCode}`, { size: 9, color: [0.2, 0.2, 0.2] });
  y -= 10;

  for (const signature of info.signatures) {
    if (y < M + 70) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
    const top = y + 12;
    text(`Assinado eletronicamente por ${signature.name}`, { size: 11, f: bold, x: M + 10, width: W - 2 * M - 20 });
    if (signature.role) text(signature.role, { size: 9, x: M + 10, color: [0.3, 0.3, 0.3] });
    text(`Em ${brasilia(signature.signedAt)} (horário de Brasília) - código da assinatura ${signature.code}`, { size: 9, x: M + 10 });
    page.drawRectangle({ x: M, y: y + 4, width: W - 2 * M, height: top - y - 4, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 0.8 });
    y -= 10;
  }

  y -= 6;
  text(
    'Assinatura eletrônica avançada (Lei nº 14.063/2020, art. 4º, II), feita com certificado emitido pela Autoridade Certificadora DigiUrban e liberada pela senha pessoal de quem assinou. ' +
      'As assinaturas valem sobre o conteúdo do documento acima; qualquer alteração aparece na conferência.',
    { size: 8, color: [0.3, 0.3, 0.3] }
  );
  text(`Resumo (SHA-256) do conteúdo: ${info.contentHash}`, { size: 7, color: [0.4, 0.4, 0.4] });

  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

/** Certificado do município para o selo (emitido sozinho na primeira vez) */
export async function ensureSystemCertificate() {
  const authority = await getPlatformCA();
  const current = await prisma.digitalCertificate.findFirst({
    where: { userId: null, citizenId: null, certificateType: 'SYSTEM', status: 'ACTIVE', issuerCA: authority.id, expiresAt: { gt: new Date() } },
    orderBy: { issuedAt: 'desc' },
  });
  if (current) return current;
  const tenantId = tryGetTenantId();
  const tenant = tenantId ? await prisma.tenant.findFirst({ where: { id: tenantId }, select: { nome: true } }).catch(() => null) : null;
  return issueCertificate({
    commonName: `${(tenant as any)?.nome || 'Prefeitura Municipal'} - selo de documentos`,
    email: '',
    department: 'Sistema',
    certificateType: 'SYSTEM',
    validityYears: 5,
    createdBy: 'SYSTEM',
  });
}

/**
 * Selo digital do município no PDF final (assinatura PDF/PKCS#7). Não-fatal:
 * se falhar, o PDF segue com a folha de assinaturas (que já é conferível).
 */
export async function sealPdf(pdfBytes: Buffer, reason: string): Promise<Buffer> {
  try {
    const [{ default: signpdf }, { P12Signer }, { pdflibAddPlaceholder }] = await Promise.all([
      import('@signpdf/signpdf'),
      import('@signpdf/signer-p12'),
      import('@signpdf/placeholder-pdf-lib'),
    ]);
    const certificate = await ensureSystemCertificate();
    const keyPem = await loadSigningKey(certificate);
    const authority = await getPlatformCA();
    const passphrase = 'selo';
    const p12 = forge.pkcs12.toPkcs12Asn1(
      forge.pki.privateKeyFromPem(keyPem),
      [forge.pki.certificateFromPem(certificate.certificateChain), authority.cert],
      passphrase,
      { algorithm: '3des' }
    );
    const p12Buffer = Buffer.from(forge.asn1.toDer(p12).getBytes(), 'binary');

    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pdflibAddPlaceholder({
      pdfDoc: doc,
      reason: latin(reason).slice(0, 120),
      contactInfo: '',
      name: latin(certificate.commonName).slice(0, 120),
      location: 'Brasil',
    } as any);
    const withPlaceholder = Buffer.from(await doc.save({ useObjectStreams: false }));
    const signed = await (signpdf as any).sign(withPlaceholder, new P12Signer(p12Buffer, { passphrase }));
    return Buffer.from(signed);
  } catch (error) {
    console.warn('[assinatura] selo do PDF não aplicado:', error instanceof Error ? error.message : error);
    return pdfBytes;
  }
}
