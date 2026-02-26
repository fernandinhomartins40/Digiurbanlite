import { prisma } from '../models/prisma';
import { logger } from '../utils/logger';
import { runPncpIngest } from './sources/pncp.ingest';
import { runComprasnetIngest } from './sources/comprasnet.ingest';
import { runTransparenciaIngest } from './sources/transparencia.ingest';
import { runBpsIngest } from './sources/bps.ingest';
import { runFndeIngest } from './sources/fnde.ingest';

export type IngestSource = 'pncp' | 'comprasnet' | 'transparencia' | 'bps' | 'fnde' | 'all';

export interface OrchestratorOptions {
  source?: IngestSource;
  sinceDays?: number;
  uf?: string;
  triggeredBy?: string;
  bpsMaxFiles?: number;
}

export interface OrchestratorResult {
  source: string;
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

export async function runIngestOrchestrator(options: OrchestratorOptions = {}): Promise<OrchestratorResult[]> {
  const {
    source = 'all',
    sinceDays,
    uf,
    triggeredBy = 'manual',
    bpsMaxFiles = 2,
  } = options;

  const sources: IngestSource[] = source === 'all'
    ? ['pncp', 'comprasnet', 'transparencia', 'bps', 'fnde']
    : [source];

  logger.info('[Orchestrator] Starting multi-source ingest', { sources, sinceDays, uf, triggeredBy });

  const results: OrchestratorResult[] = [];

  for (const src of sources) {
    const runRecord = await prisma.ingestRun.create({
      data: {
        source: src,
        status: 'running',
        triggeredBy,
        sinceDays: sinceDays ?? 365,
      },
    });

    const startMs = Date.now();

    try {
      let result: { ingested: number; updated: number; skipped: number; errors: number };

      switch (src) {
        case 'pncp':
          result = await runPncpIngest({ sinceDays, uf, runId: runRecord.id });
          break;
        case 'comprasnet':
          result = await runComprasnetIngest({ sinceDays, uf, runId: runRecord.id });
          break;
        case 'transparencia':
          result = await runTransparenciaIngest({ sinceDays, runId: runRecord.id });
          break;
        case 'bps':
          result = await runBpsIngest({ runId: runRecord.id, maxFiles: bpsMaxFiles });
          break;
        case 'fnde':
          result = await runFndeIngest({ sinceDays, uf, runId: runRecord.id });
          break;
        default:
          result = { ingested: 0, updated: 0, skipped: 0, errors: 0 };
      }

      const durationMs = Date.now() - startMs;

      await prisma.ingestRun.update({
        where: { id: runRecord.id },
        data: {
          status: result.errors > 0 && result.ingested === 0 ? 'failed' : 'completed',
          finishedAt: new Date(),
          itemsIngested: result.ingested,
          itemsUpdated: result.updated,
          itemsSkipped: result.skipped,
          errors: result.errors,
        },
      });

      results.push({ source: src, ...result, durationMs });
      logger.info('[Orchestrator] Source done', { source: src, ...result, durationMs });
    } catch (err: unknown) {
      const durationMs = Date.now() - startMs;
      logger.error('[Orchestrator] Source failed', { source: src, error: (err as Error).message });

      await prisma.ingestRun.update({
        where: { id: runRecord.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errors: 1,
          errorDetails: { message: (err as Error).message } as import('@prisma/client').Prisma.InputJsonValue,
        },
      });

      results.push({ source: src, ingested: 0, updated: 0, skipped: 0, errors: 1, durationMs });
    }
  }

  const total = results.reduce((acc, r) => ({
    ingested: acc.ingested + r.ingested,
    updated: acc.updated + r.updated,
    skipped: acc.skipped + r.skipped,
    errors: acc.errors + r.errors,
  }), { ingested: 0, updated: 0, skipped: 0, errors: 0 });

  logger.info('[Orchestrator] All sources done', { total, sources });
  return results;
}
