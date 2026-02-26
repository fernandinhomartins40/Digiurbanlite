// ingest.job.ts — Wrapper que delega ao orquestrador multi-source
// Mantido para compatibilidade com ingest.worker.ts

import { runIngestOrchestrator, IngestSource } from './ingest.orchestrator';
import { logger } from '../utils/logger';

export interface IngestJobOptions {
  sinceDays?: number;
  triggeredBy?: string;
  uf?: string;
  source?: IngestSource;     // "all" | "pncp" | "comprasnet" | "transparencia" | "bps" | "fnde"
  bpsMaxFiles?: number;
}

export interface IngestJobResult {
  runId: string;
  itemsIngested: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: number;
  durationMs: number;
}

export async function runIngestJob(options: IngestJobOptions = {}): Promise<IngestJobResult> {
  const startMs = Date.now();
  logger.info('[IngestJob] Starting via orchestrator', options);

  const results = await runIngestOrchestrator({
    source: options.source ?? 'all',
    sinceDays: options.sinceDays,
    uf: options.uf,
    triggeredBy: options.triggeredBy ?? 'worker',
    bpsMaxFiles: options.bpsMaxFiles,
  });

  const totals = results.reduce(
    (acc, r) => ({
      ingested: acc.ingested + r.ingested,
      updated: acc.updated + r.updated,
      skipped: acc.skipped + r.skipped,
      errors: acc.errors + r.errors,
    }),
    { ingested: 0, updated: 0, skipped: 0, errors: 0 },
  );

  const durationMs = Date.now() - startMs;

  logger.info('[IngestJob] Done', { ...totals, durationMs });

  return {
    runId: `multi_${Date.now()}`,
    itemsIngested: totals.ingested,
    itemsUpdated: totals.updated,
    itemsSkipped: totals.skipped,
    errors: totals.errors,
    durationMs,
  };
}
