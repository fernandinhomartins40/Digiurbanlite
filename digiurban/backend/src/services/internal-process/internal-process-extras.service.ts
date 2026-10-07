/**
 * Processo interno — inteligência e documento:
 *  - resumo por IA (cobrado nos créditos do município; sem IA, o sistema segue);
 *  - assinatura eletrônica (confirmação de senha + código de verificação no histórico);
 *  - PDF do processo com texto, despachos e assinaturas.
 *
 * Assinatura eletrônica com login e senha (Lei 14.063/2020, art. 4º). A
 * assinatura com certificado ICP-Brasil continua nos documentos dos protocolos.
 */

import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';
import { complete } from '../ai-gateway/gateway';
import { getProcess, InternalProcessError } from './internal-process.service';
import { canViewProcess, ProcessActor } from './rules';
import { documentHash, getDocument } from './flows/flow.service';

/** Resumo curto do processo (assunto, texto, despachos e pareceres) para quem chega agora */
export async function summarizeProcess(actor: ProcessActor & { name: string }, id: string): Promise<string> {
  const process: any = await getProcess(actor, id);
  const tenantId = tryGetTenantId();
  if (!tenantId) throw new InternalProcessError('Município não identificado');
  const history = (process.movements || [])
    .filter((move: any) => move.note)
    .slice(-20)
    .map((move: any) => `- ${move.action} (${move.fromUnitName || move.toUnitName || ''}): ${String(move.note).slice(0, 600)}`)
    .join('\n');
  const prompt = [
    `Processo ${process.number} (${process.type?.name}). Assunto: ${process.subject}`,
    process.body ? `Texto inicial:\n${String(process.body).slice(0, 4000)}` : '',
    history ? `Despachos e pareceres:\n${history}` : '',
    process.conclusion ? `Conclusão: ${process.conclusion}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const result = await complete({
      tenantId,
      task: 'internal-process-summary',
      source: 'admin',
      tier: 'fast',
      system:
        'Você resume processos administrativos internos de uma prefeitura para o servidor que acabou de recebê-lo. Responda em português do Brasil, em até 6 linhas: o que foi pedido, o que já foi feito/decidido e o que falta. Não invente fatos.',
      prompt,
      maxTokens: 400,
    } as any);
    const summary = result.content.trim();
    if (!summary) throw new InternalProcessError('A IA não conseguiu resumir agora.');
    await prisma.internalProcess.update({ where: { id }, data: { summary } });
    return summary;
  } catch (error: any) {
    if (error instanceof InternalProcessError) throw error;
    if (error?.status === 402) throw new InternalProcessError('O município está sem créditos de IA. Veja em IA e créditos.', 402);
    throw new InternalProcessError('A IA está indisponível agora. O processo segue normalmente.', 503);
  }
}

function contentFingerprint(process: { number: string; subject: string; body: string | null; conclusion: string | null }) {
  return createHash('sha256').update(JSON.stringify([process.number, process.subject, process.body || '', process.conclusion || ''])).digest('hex');
}

/** Assinar eletronicamente (pede a senha de novo). O código vai para o histórico. */
export async function signProcess(actor: ProcessActor & { name: string }, id: string, password: string) {
  const process: any = await getProcess(actor, id);
  const user = await prisma.user.findFirst({ where: { id: actor.id }, select: { password: true, name: true } });
  if (!user || !password || !(await bcrypt.compare(password, user.password))) {
    throw new InternalProcessError('Senha incorreta.');
  }
  const signedAt = new Date();
  const hash = createHash('sha256')
    .update(`${contentFingerprint(process)}|${actor.id}|${signedAt.toISOString()}`)
    .digest('hex');
  const code = hash.slice(0, 16).toUpperCase();
  await prisma.internalProcessMovement.create({
    data: {
      processId: id,
      action: 'ASSINADO',
      note: `Assinado eletronicamente por ${user.name} — código ${code.match(/.{1,4}/g)!.join('-')}`,
      userId: actor.id,
      userName: user.name,
      signatureHash: hash,
      readAt: signedAt,
      createdAt: signedAt,
    },
  });
  return { code, signedAt };
}

/** Confere um código de assinatura (mostra quem assinou, o quê e se o conteúdo mudou depois) */
export async function verifySignature(actor: ProcessActor, code: string) {
  const clean = String(code || '').replace(/[^0-9a-f]/gi, '').toLowerCase();
  if (clean.length < 16) throw new InternalProcessError('Código inválido.');
  // documento do processo (DFD, ETP, parecer...)
  const signedDoc = await prisma.internalProcessDocument.findFirst({
    where: { signatureHash: { startsWith: clean.slice(0, 16) } },
    include: { process: true },
  });
  if (signedDoc) {
    if (!canViewProcess(actor, { ...signedDoc.process, involvedUnitIds: [], involvedUserIds: [] }) && signedDoc.process.confidential) {
      throw new InternalProcessError('Assinatura não encontrada.', 404);
    }
    const expectedDoc = documentHash(signedDoc, signedDoc.signedById || '', signedDoc.signedAt!);
    return {
      number: signedDoc.process.number,
      subject: `${signedDoc.title} — ${signedDoc.process.subject}`,
      signer: signedDoc.signedByName,
      signedAt: signedDoc.signedAt,
      valid: expectedDoc === signedDoc.signatureHash,
    };
  }

  const movement = await prisma.internalProcessMovement.findFirst({
    where: { signatureHash: { startsWith: clean.slice(0, 16) } },
    include: { process: true },
  });
  if (!movement) throw new InternalProcessError('Assinatura não encontrada.', 404);
  const process = movement.process;
  if (!canViewProcess(actor, { ...process, involvedUnitIds: [], involvedUserIds: [] }) && process.confidential) {
    throw new InternalProcessError('Assinatura não encontrada.', 404);
  }
  const expected = createHash('sha256')
    .update(`${contentFingerprint(process)}|${movement.userId}|${movement.createdAt.toISOString()}`)
    .digest('hex');
  return {
    number: process.number,
    subject: process.subject,
    signer: movement.userName,
    signedAt: movement.createdAt,
    valid: expected === movement.signatureHash,
  };
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** PDF do processo: cabeçalho do município, texto, histórico e assinaturas */
export async function processPdf(actor: ProcessActor & { name: string }, id: string): Promise<{ buffer: Buffer; filename: string }> {
  const process: any = await getProcess(actor, id);
  const tenantId = tryGetTenantId();
  const tenant = tenantId ? await prisma.tenant.findFirst({ where: { id: tenantId }, select: { nome: true } }).catch(() => null) : null;
  const moves = (process.movements || []) as any[];
  const signatures = moves.filter((move) => move.action === 'ASSINADO');
  const history = moves.filter((move) => move.action !== 'ASSINADO' && (move.note || ['ENCAMINHADO', 'DEVOLVIDO', 'CONCLUIDO'].includes(move.action)));
  const date = (value: Date | string) => new Date(value).toLocaleString('pt-BR');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 0; }
    h1 { font-size: 16px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 18px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .muted { color: #555; } .box { white-space: pre-wrap; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; } td { padding: 3px 0; vertical-align: top; }
    .item { margin: 6px 0; } .sig { border: 1px solid #ccc; padding: 6px 8px; margin: 6px 0; }
  </style></head><body>
    <p class="muted">${escapeHtml(tenant?.nome || 'Prefeitura Municipal')}</p>
    <h1>${escapeHtml(process.type?.name)} nº ${escapeHtml(process.number)}</h1>
    <table>
      <tr><td width="90"><b>De:</b></td><td>${escapeHtml(process.originUnitName)} (${escapeHtml(process.createdByName)})</td></tr>
      <tr><td><b>Situação:</b></td><td>${escapeHtml(process.status)} — em ${escapeHtml(process.currentUnitName)}</td></tr>
      <tr><td><b>Aberto em:</b></td><td>${date(process.createdAt)}</td></tr>
      <tr><td><b>Assunto:</b></td><td>${escapeHtml(process.subject)}</td></tr>
    </table>
    ${process.body ? `<h2>Texto</h2><div class="box">${escapeHtml(process.body)}</div>` : ''}
    ${history.length ? `<h2>Tramitação e despachos</h2>${history
      .map((move) => `<div class="item"><b>${escapeHtml(move.action)}</b> — ${escapeHtml(move.userName)}, ${date(move.createdAt)}${move.fromUnitName && move.toUnitName ? ` · ${escapeHtml(move.fromUnitName)} → ${escapeHtml(move.toUnitName)}` : ''}${move.note ? `<div class="box">${escapeHtml(move.note)}</div>` : ''}</div>`)
      .join('')}` : ''}
    ${(process.documents || []).length ? `<h2>Documentos</h2>${(process.documents as any[])
      .map((doc) => `<div class="item">${escapeHtml(doc.title)}${doc.signedAt ? ` — assinado por ${escapeHtml(doc.signedByName)} em ${date(doc.signedAt)}` : ' — não assinado'}</div>`)
      .join('')}` : ''}
    ${process.conclusion ? `<h2>Conclusão</h2><div class="box">${escapeHtml(process.conclusion)}</div>` : ''}
    ${signatures.length ? `<h2>Assinaturas eletrônicas</h2>${signatures
      .map((move) => `<div class="sig">${escapeHtml(move.userName)} — ${date(move.createdAt)}<br><span class="muted">Código de verificação: ${escapeHtml(String(move.signatureHash || '').slice(0, 16).toUpperCase().match(/.{1,4}/g)?.join('-'))}</span></div>`)
      .join('')}<p class="muted">Assinatura eletrônica com login e senha (Lei 14.063/2020). Confira o código em Processos internos › Conferir assinatura.</p>` : ''}
  </body></html>`;

  return { buffer: await renderPdf(html), filename: `${process.number}.pdf` };
}

async function renderPdf(html: string): Promise<Buffer> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const buffer = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '18mm' }, printBackground: true });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

/** PDF de um documento do processo (texto do modelo + assinatura) */
export async function documentPdf(actor: ProcessActor, documentId: string): Promise<{ buffer: Buffer; filename: string }> {
  const { document } = await getDocument(actor, documentId);
  const code = document.signatureHash ? document.signatureHash.slice(0, 16).toUpperCase().match(/.{1,4}/g)!.join('-') : null;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body { font-family: 'Times New Roman', serif; font-size: 12.5px; color: #111; line-height: 1.55; }
    .text { white-space: pre-wrap; } .sig { margin-top: 24px; border-top: 1px solid #999; padding-top: 6px; font-family: Arial, sans-serif; font-size: 10.5px; color: #333; }
  </style></head><body>
    <div class="text">${escapeHtml(document.content)}</div>
    ${code ? `<div class="sig">Documento assinado eletronicamente por ${escapeHtml(document.signedByName)} em ${new Date(document.signedAt!).toLocaleString('pt-BR')} (Lei 14.063/2020). Código de verificação: ${code}</div>` : '<div class="sig">Documento ainda não assinado.</div>'}
  </body></html>`;
  const safe = document.title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 60);
  return { buffer: await renderPdf(html), filename: `${safe}.pdf` };
}
