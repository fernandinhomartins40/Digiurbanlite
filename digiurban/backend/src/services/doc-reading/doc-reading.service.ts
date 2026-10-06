/**
 * Leitura automática dos documentos enviados (fotos), pelo motor interno
 * ultrazend-doc-engine (PaddleOCR + ZXing). Uma rotina a cada 2 minutos procura,
 * em cada município, as fotos novas ou reenviadas que ainda não foram lidas —
 * assim vale para TODO caminho de envio (portal, pendência, assistente, balcão)
 * sem amarrar a leitura em cada um deles.
 *
 * Grava só o resultado da conferência (DocumentReading), nunca o texto lido.
 * É um aviso para o servidor: aprovar ou recusar continua sendo de uma pessoa.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '../../lib/prisma';
import { runAsPlatform, tryGetTenantId } from '../../lib/tenant-context';
import { forEachActiveTenant } from '../../lib/tenant-iterator';
import { uploadUrlToDiskPath } from '../../config/upload';
import { analyzeReading, EngineCode, EngineLine, ExpectedPerson } from './rules';

export type ReadingSource = 'CITIZEN_DOCUMENT' | 'PROTOCOL_DOCUMENT';

const ENGINE_URL = (process.env.DOC_ENGINE_URL || 'http://ultrazend-doc-engine:8000').replace(/\/+$/, '');
const ENGINE_TOKEN = process.env.DOC_ENGINE_TOKEN || '';
const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;
const BATCH = 25;

class EngineUnavailable extends Error {}

export async function getDocScannerSettings() {
  return runAsPlatform(async () =>
    prisma.docScannerSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton' }, update: {} })
  );
}

/** Caminho no disco: aceita "/uploads/...", "uploads/..." (relativo ao backend) ou caminho absoluto */
export function resolveDocumentFile(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const candidates: string[] = [];
  if (path.isAbsolute(stored) && !stored.startsWith('/uploads/')) candidates.push(stored);
  try {
    candidates.push(uploadUrlToDiskPath(stored));
  } catch {
    // caminho fora da pasta de envios: ignora esta forma
  }
  candidates.push(path.resolve(process.cwd(), stored.replace(/^\/+/, '')));
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

async function callEngine(image: Buffer): Promise<{ lines: EngineLine[]; codes: EngineCode[]; ms: number }> {
  let response: Response;
  try {
    response = await fetch(`${ENGINE_URL}/v1/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ENGINE_TOKEN ? { Authorization: `Bearer ${ENGINE_TOKEN}` } : {}),
      },
      body: JSON.stringify({ image: image.toString('base64'), codes: true }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    throw new EngineUnavailable(error instanceof Error ? error.message : 'motor de leitura fora do ar');
  }
  if (response.status >= 500) throw new EngineUnavailable(`motor respondeu ${response.status}`);
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.detail || `motor respondeu ${response.status}`);
  return { lines: body.lines || [], codes: body.codes || [], ms: Number(body.ms) || 0 };
}

interface ReadTarget {
  source: ReadingSource;
  documentId: string;
  fileKey: string;
  mimeType: string | null;
  documentType: string | null;
  person: ExpectedPerson;
}

async function saveReading(target: ReadTarget, data: Record<string, unknown>) {
  const tenantId = tryGetTenantId() || null;
  const values = { tenantId, fileKey: target.fileKey, ...data };
  await prisma.documentReading.upsert({
    where: { source_documentId: { source: target.source, documentId: target.documentId } },
    create: { source: target.source, documentId: target.documentId, ...(values as any) },
    update: values as any,
  });
}

async function readTarget(target: ReadTarget) {
  if (!target.mimeType?.startsWith('image/')) {
    await saveReading(target, { status: 'SKIPPED', note: 'Só fotos são lidas (PDF fica para conferência manual).' });
    return;
  }
  const file = resolveDocumentFile(target.fileKey);
  if (!file) {
    await saveReading(target, { status: 'FAILED', note: 'Arquivo não encontrado no servidor.' });
    return;
  }
  let image: Buffer;
  try {
    image = await sharp(file).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  } catch {
    await saveReading(target, { status: 'FAILED', note: 'Não foi possível abrir a imagem.' });
    return;
  }
  const result = await callEngine(image);
  const analysis = analyzeReading(result.lines, result.codes, target.documentType, target.person);
  await saveReading(target, {
    status: 'DONE',
    note: analysis.lineCount === 0 ? 'Nenhum texto legível na foto.' : null,
    ...analysis,
    engineMs: result.ms,
  });
}

/** Fotos novas/reenviadas do município atual que ainda não foram lidas */
async function pendingTargets(): Promise<ReadTarget[]> {
  const since = new Date(Date.now() - LOOKBACK_MS);
  const [citizenDocs, protocolDocs] = await Promise.all([
    prisma.citizenDocument.findMany({
      // documentos gerados pela prefeitura (sourceType PROTOCOL) não são lidos
      where: { updatedAt: { gte: since }, OR: [{ sourceType: null }, { sourceType: { not: 'PROTOCOL' } }] },
      select: {
        id: true,
        filePath: true,
        mimeType: true,
        documentType: true,
        citizen: { select: { name: true, cpf: true, birthDate: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: BATCH,
    }),
    prisma.protocolDocument.findMany({
      where: { updatedAt: { gte: since }, fileUrl: { not: null } },
      select: {
        id: true,
        fileUrl: true,
        mimeType: true,
        documentType: true,
        protocol: { select: { citizen: { select: { name: true, cpf: true, birthDate: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: BATCH,
    }),
  ]);

  const targets: ReadTarget[] = [
    ...citizenDocs.map((doc) => ({
      source: 'CITIZEN_DOCUMENT' as const,
      documentId: doc.id,
      fileKey: doc.filePath,
      mimeType: doc.mimeType,
      documentType: doc.documentType,
      person: doc.citizen || {},
    })),
    ...protocolDocs.map((doc) => ({
      source: 'PROTOCOL_DOCUMENT' as const,
      documentId: doc.id,
      fileKey: doc.fileUrl as string,
      mimeType: doc.mimeType,
      documentType: doc.documentType,
      person: doc.protocol?.citizen || {},
    })),
  ];
  if (!targets.length) return [];

  const done = await prisma.documentReading.findMany({
    where: { documentId: { in: targets.map((target) => target.documentId) } },
    select: { source: true, documentId: true, fileKey: true },
  });
  const seen = new Map(done.map((reading) => [`${reading.source}:${reading.documentId}`, reading.fileKey]));
  return targets.filter((target) => seen.get(`${target.source}:${target.documentId}`) !== target.fileKey);
}

let running = false;

/** Uma volta da leitura em todos os municípios. Motor fora do ar: para e tenta na próxima. */
export async function runDocReadingSweep(): Promise<{ read: number; skipped: boolean }> {
  if (running) return { read: 0, skipped: true };
  const settings = await getDocScannerSettings();
  if (!settings.readingEnabled) return { read: 0, skipped: true };
  running = true;
  let read = 0;
  try {
    await forEachActiveTenant('doc-reading', async () => {
      for (const target of await pendingTargets()) {
        try {
          await readTarget(target);
          read += 1;
        } catch (error) {
          if (error instanceof EngineUnavailable) throw error;
          await saveReading(target, { status: 'FAILED', note: String((error as Error)?.message || error).slice(0, 300) });
        }
      }
    });
  } catch (error) {
    if (!(error instanceof EngineUnavailable)) throw error;
    console.warn('[doc-reading] motor de leitura indisponível, tenta de novo depois:', error.message);
  } finally {
    running = false;
  }
  return { read, skipped: false };
}

let kickTimer: NodeJS.Timeout | null = null;

/** Pede uma leitura logo (depois de um envio), sem esperar a rotina de 2 minutos */
export function kickDocReading() {
  if (kickTimer) return;
  kickTimer = setTimeout(() => {
    kickTimer = null;
    runDocReadingSweep().catch((error) => console.error('[doc-reading] falha na leitura:', error));
  }, 3000);
}

/** Resultados para a tela do servidor */
export async function getReadings(source: ReadingSource, documentIds: string[]) {
  if (!documentIds.length) return [];
  return prisma.documentReading.findMany({
    where: { source, documentId: { in: documentIds.slice(0, 200) } },
    select: {
      documentId: true,
      status: true,
      note: true,
      detectedKind: true,
      expectedKind: true,
      kindMatches: true,
      nameMatch: true,
      cpfMatch: true,
      birthDateMatch: true,
      mrzValid: true,
      qrFound: true,
      qrGovUrl: true,
      textQuality: true,
      updatedAt: true,
    },
  });
}
