import 'dotenv/config';
import { prisma } from '../src/models/prisma';
import { config } from '../src/config/config';
import { ensureIndexExists } from '../src/search_index/opensearch.client';
import { runIngestOrchestrator, type IngestSource } from '../src/ingest/ingest.orchestrator';
import { logger } from '../src/utils/logger';

interface CliOptions {
  sinceDays: number;
  uf?: string;
  bpsMaxFiles: number;
  sources: IngestSource[];
}

const DEFAULT_BACKFILL_SOURCES: IngestSource[] = ['pncp', 'comprasnet', 'transparencia', 'bps'];

async function main() {
  const cli = parseCli();

  logger.info('[Backfill] Starting historical ingest', cli);

  await prisma.$connect();
  await ensureIndexExists().catch((error: Error) => {
    logger.warn('[Backfill] Could not ensure OpenSearch index', { error: error.message });
  });

  const summaries: Array<{ source: string; ingested: number; updated: number; skipped: number; errors: number; durationMs: number }> = [];

  for (const source of cli.sources) {
    const results = await runIngestOrchestrator({
      source,
      sinceDays: cli.sinceDays,
      uf: cli.uf,
      triggeredBy: 'backfill-script',
      bpsMaxFiles: source === 'bps' ? cli.bpsMaxFiles : undefined,
    });

    summaries.push(...results);
  }

  const totals = summaries.reduce(
    (acc, item) => ({
      ingested: acc.ingested + item.ingested,
      updated: acc.updated + item.updated,
      skipped: acc.skipped + item.skipped,
      errors: acc.errors + item.errors,
      durationMs: acc.durationMs + item.durationMs,
    }),
    { ingested: 0, updated: 0, skipped: 0, errors: 0, durationMs: 0 },
  );

  console.table(summaries.map((item) => ({
    source: item.source,
    ingested: item.ingested,
    updated: item.updated,
    skipped: item.skipped,
    errors: item.errors,
    duration_s: (item.durationMs / 1000).toFixed(1),
  })));

  console.log('\nTotals:', {
    ingested: totals.ingested,
    updated: totals.updated,
    skipped: totals.skipped,
    errors: totals.errors,
    durationMinutes: Number((totals.durationMs / 60000).toFixed(2)),
  });
}

function parseCli(): CliOptions {
  const rawArgs = new Map<string, string>();

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=', 2);
    rawArgs.set(key, value ?? 'true');
  }

  const sourcesArg = rawArgs.get('sources') ?? 'default';
  const sources = sourcesArg === 'all'
    ? (['pncp', 'comprasnet', 'transparencia', 'bps', 'fnde'] as IngestSource[])
    : sourcesArg === 'default'
      ? DEFAULT_BACKFILL_SOURCES
    : sourcesArg
        .split(',')
        .map((item) => item.trim())
        .filter((item): item is IngestSource => ['pncp', 'comprasnet', 'transparencia', 'bps', 'fnde', 'all'].includes(item));

  return {
    sinceDays: parseInteger(rawArgs.get('since-days'), config.ingest.historicalDays),
    uf: rawArgs.get('uf') || undefined,
    bpsMaxFiles: parseInteger(rawArgs.get('bps-max-files'), 0),
    sources: sources.length > 0 ? sources : DEFAULT_BACKFILL_SOURCES,
  };
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

main()
  .catch((error) => {
    console.error('[Backfill] Failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
