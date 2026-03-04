import { prisma } from '../../src/lib/prisma';
import { centralCalendarService } from '../../src/services/central-calendar.service';

type BackfillResult = {
  success: number;
  failed: number;
};

async function processInBatches(
  ids: string[],
  task: (id: string) => Promise<void>,
  batchSize = 50
): Promise<BackfillResult> {
  const result: BackfillResult = { success: 0, failed: 0 };

  for (let offset = 0; offset < ids.length; offset += batchSize) {
    const batch = ids.slice(offset, offset + batchSize);
    await Promise.all(
      batch.map(async (id) => {
        try {
          await task(id);
          result.success += 1;
        } catch (error) {
          result.failed += 1;
          console.warn('[central-calendar-backfill] Falha ao processar item', {
            id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );
  }

  return result;
}

async function runBackfill() {
  console.log('[central-calendar-backfill] Iniciando backfill da agenda centralizada...');

  const [legacyAgendaIds, healthAgendaIds, tfdScheduleIds, stageIds] = await Promise.all([
    prisma.agendaEvent.findMany({
      select: { id: true },
    }),
    prisma.agendaMedica.findMany({
      select: { id: true },
    }),
    prisma.agendamentoExternoTFD.findMany({
      select: { id: true },
    }),
    prisma.protocolStage.findMany({
      select: { id: true },
    }),
  ]);

  const legacyResult = await processInBatches(
    legacyAgendaIds.map((item) => item.id),
    async (id) => {
      await centralCalendarService.syncLegacyGabineteEventByLegacyId(id);
    }
  );

  const healthResult = await processInBatches(
    healthAgendaIds.map((item) => item.id),
    async (id) => {
      await centralCalendarService.syncHealthAgendaById(id);
    }
  );

  const tfdResult = await processInBatches(
    tfdScheduleIds.map((item) => item.id),
    async (id) => {
      await centralCalendarService.syncTFDExternalScheduleById(id);
    }
  );

  const stageResult = await processInBatches(
    stageIds.map((item) => item.id),
    async (id) => {
      await centralCalendarService.syncProtocolStageEventByStageId(id);
    }
  );

  console.log('[central-calendar-backfill] Resultado final', {
    legacyAgenda: legacyResult,
    healthAgenda: healthResult,
    tfdSchedules: tfdResult,
    protocolStages: stageResult,
  });
}

runBackfill()
  .catch((error) => {
    console.error('[central-calendar-backfill] Falha fatal', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
