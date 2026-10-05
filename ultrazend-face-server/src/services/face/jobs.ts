/**
 * Rotinas automáticas da biometria (sem ação de ninguém):
 *
 * 1. Reprocessamento: cadastros aprovados que ainda não têm assinatura no
 *    modelo escolhido no painel (ex.: os feitos com o face-api.js antigo, ou
 *    depois de trocar o modelo) são recalculados a partir da foto do cadastro.
 *    O cidadão não precisa refazer nada. Sem foto utilizável: fica marcado para
 *    novo cadastro.
 * 2. Prazo de guarda (LGPD): apaga fotos de quem a câmera não reconheceu, fotos
 *    antigas de passagem e os registros vencidos, conforme Super-admin › Privacidade.
 */

import { FaceEnrollmentStatus, FaceMatchStatus, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import logger from '../../utils/logger';
import faceStorageService from './face-storage.service';
import { analyzeFrames } from './engine-client';
import { normalize } from './decisions';
import { getEngineSettings, getFaceRetentionSettings } from './settings';
import { logFaceAccess } from './access-log';

const DAY = 24 * 60 * 60 * 1000;
let running = false;

export async function reprocessPendingEmbeddings(batchSize = 20) {
  const settings = await getEngineSettings();
  const model = settings.recognitionModel;

  // O filtro de "já falhou neste modelo" é feito aqui no código: no banco, um
  // NOT sobre campo JSON ausente/nulo exclui a linha (e os cadastros antigos,
  // sem essa anotação, nunca eram convertidos). Os que falham têm o updatedAt
  // renovado e vão para o fim da fila — sem travar os demais.
  const candidates = await prisma.faceEnrollment.findMany({
    where: {
      status: FaceEnrollmentStatus.APPROVED,
      imagePath: { not: null },
      identity: { embeddings: { none: { modelName: model, isActive: true } } },
    },
    orderBy: { updatedAt: 'asc' },
    take: batchSize * 3,
    include: { identity: { select: { id: true, tenantId: true, citizenId: true } } },
  });
  const enrollments = candidates
    .filter((item) => (item.metadata as Record<string, unknown> | null)?.reprocessFailedModel !== model)
    .slice(0, batchSize);

  let converted = 0;
  let failed = 0;
  for (const enrollment of enrollments) {
    const tenantId = enrollment.tenantId || enrollment.identity.tenantId;
    try {
      const image = await faceStorageService.readImageAsBase64(enrollment.imagePath!);
      const analysis = await analyzeFrames([image], { model });
      const faces = analysis.frames[0]?.faces || [];
      if (analysis.frames[0]?.facesDetected !== 1 || !faces[0]) throw new Error('foto sem exatamente um rosto');

      await prisma.$transaction(async (tx) => {
        await tx.faceEmbedding.create({
          data: {
            tenantId,
            identityId: enrollment.identityId,
            enrollmentId: enrollment.id,
            modelName: analysis.model.name,
            modelVersion: `uniface-${analysis.model.version}`,
            vector: normalize(faces[0].embedding),
            qualityScore: faces[0].quality,
            isActive: true,
          },
        });
        // a assinatura do motor antigo não serve mais e não deve ficar guardada
        await tx.faceEmbedding.deleteMany({ where: { identityId: enrollment.identityId, modelName: { not: model } } });
      });
      converted += 1;
    } catch (error: any) {
      failed += 1;
      const metadata = (enrollment.metadata && typeof enrollment.metadata === 'object' ? enrollment.metadata : {}) as Record<string, unknown>;
      await prisma.faceEnrollment.update({
        where: { id: enrollment.id },
        data: { metadata: { ...metadata, reprocessFailedModel: model, reprocessError: String(error?.message || error).slice(0, 200) } as Prisma.InputJsonValue },
      }).catch(() => undefined);
    }
  }

  if (enrollments.length) {
    logger.info('Biometria: reprocessamento no modelo atual', { model, converted, failed });
  }
  return { model, processed: enrollments.length, converted, failed };
}

export async function applyFaceRetention() {
  const settings = await getFaceRetentionSettings();
  const now = Date.now();
  const unmatchedCut = new Date(now - settings.faceUnmatchedImageDays * DAY);
  const imageCut = new Date(now - settings.faceEventImageDays * DAY);
  const eventCut = new Date(now - settings.faceEventDays * DAY);
  const rejectedEnrollmentCut = new Date(now - 30 * DAY);

  // 1. fotos a apagar (eventos)
  const eventPhotos = await prisma.faceRecognitionEvent.findMany({
    where: {
      previewPath: { not: null },
      OR: [
        { matchStatus: FaceMatchStatus.UNMATCHED, recognizedAt: { lt: unmatchedCut } },
        { recognizedAt: { lt: imageCut } },
      ],
    },
    select: { id: true, previewPath: true },
    take: 5000,
  });

  // eventos de uma mesma leitura dividem a foto: só apaga o arquivo se ninguém mais usa
  const paths = Array.from(new Set(eventPhotos.map((item) => item.previewPath!)));
  await prisma.faceRecognitionEvent.updateMany({ where: { id: { in: eventPhotos.map((item) => item.id) } }, data: { previewPath: null } });
  let deletedImages = 0;
  for (const relativePath of paths) {
    const stillUsed = await prisma.faceRecognitionEvent.count({ where: { previewPath: relativePath } });
    if (!stillUsed) {
      await faceStorageService.deleteRelativePath(relativePath).catch(() => undefined);
      deletedImages += 1;
    }
  }

  // 2. fotos de cadastros recusados
  const rejected = await prisma.faceEnrollment.findMany({
    where: { status: FaceEnrollmentStatus.REJECTED, imagePath: { not: null }, updatedAt: { lt: rejectedEnrollmentCut } },
    select: { id: true, imagePath: true },
    take: 2000,
  });
  for (const enrollment of rejected) {
    await faceStorageService.deleteRelativePath(enrollment.imagePath).catch(() => undefined);
  }
  if (rejected.length) {
    await prisma.faceEnrollment.updateMany({ where: { id: { in: rejected.map((item) => item.id) } }, data: { imagePath: null } });
  }

  // 3. registros de passagem vencidos
  const deletedEvents = await prisma.faceRecognitionEvent.deleteMany({ where: { recognizedAt: { lt: eventCut }, previewPath: null } });

  // 4. registro de acesso: guarda 5 anos (prestação de contas)
  await prisma.faceAccessLog.deleteMany({ where: { createdAt: { lt: new Date(now - 5 * 365 * DAY) } } });

  const summary = {
    eventImagesDeleted: deletedImages,
    rejectedEnrollmentImagesDeleted: rejected.length,
    eventsDeleted: deletedEvents.count,
    ranAt: new Date().toISOString(),
  };

  await prisma.privacyRetentionSettings
    .update({ where: { id: 'singleton' }, data: { faceLastRunAt: new Date(), faceLastRunSummary: summary as Prisma.InputJsonValue } })
    .catch(() => undefined);
  await logFaceAccess({ tenantId: null, actor: { type: 'SYSTEM' }, action: 'RETENTION', details: summary });
  logger.info('Biometria: prazo de guarda aplicado', summary);
  return summary;
}

async function tick() {
  if (running) return;
  running = true;
  try {
    await reprocessPendingEmbeddings();
    const retention = await getFaceRetentionSettings();
    const lastRun = retention.faceLastRunAt ? new Date(retention.faceLastRunAt).getTime() : 0;
    if (Date.now() - lastRun > DAY) {
      await applyFaceRetention();
    }
  } catch (error: any) {
    logger.warn('Biometria: rotina automática falhou (tenta de novo depois)', { error: error?.message });
  } finally {
    running = false;
  }
}

/** A cada 10 minutos (primeira rodada 1 minuto após subir) */
export function startFaceJobs() {
  setTimeout(() => void tick(), 60 * 1000).unref();
  setInterval(() => void tick(), 10 * 60 * 1000).unref();
}
