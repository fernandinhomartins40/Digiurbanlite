import fs from 'fs';
import path from 'path';
import prisma from '../../utils/prisma';
import logger from '../../utils/logger';

type SeedSummary = {
  flowsDir: string | null;
  totalFiles: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const resolveFlowsDir = (): string | null => {
  const explicit = process.env.BOT_FLOWS_DIR;
  const candidates = [
    explicit,
    path.join(__dirname, '..', 'flows'),
    path.join(process.cwd(), 'src', 'bot', 'flows'),
    path.join(process.cwd(), 'dist', 'bot', 'flows'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  return null;
};

const buildMetadata = (
  existing: unknown,
  incoming: unknown
): Record<string, any> => {
  const base = isPlainObject(existing) ? existing : {};
  const next = isPlainObject(incoming) ? incoming : {};

  return {
    ...base,
    ...next,
    seedSource: 'filesystem',
    seedUpdatedAt: new Date().toISOString(),
  };
};

export async function seedFlowDefinitions(): Promise<SeedSummary> {
  const flowsDir = resolveFlowsDir();
  const seedMode = (process.env.BOT_FLOWS_SEED_MODE || 'upsert').toLowerCase();
  const summary: SeedSummary = {
    flowsDir,
    totalFiles: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  if (!flowsDir) {
    logger.warn('Flow seeding skipped: flows directory not found');
    return summary;
  }

  const files = fs
    .readdirSync(flowsDir)
    .filter((file) => file.toLowerCase().endsWith('.json'));

  summary.totalFiles = files.length;

  if (files.length === 0) {
    logger.warn('Flow seeding skipped: no JSON files found', { flowsDir });
    return summary;
  }

  for (const file of files) {
    const filePath = path.join(flowsDir, file);

    try {
      const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
      const flowData = JSON.parse(raw);

      if (!flowData?.name || !Array.isArray(flowData?.nodes)) {
        summary.skipped += 1;
        logger.warn('Flow file missing required fields', {
          file: filePath,
        });
        continue;
      }

      const existing = await prisma.flowDefinition.findUnique({
        where: { name: flowData.name },
        select: { id: true, metadata: true },
      });

      const managedBy = isPlainObject(existing?.metadata)
        ? (existing!.metadata as any).managedBy
        : undefined;

      const metadata = buildMetadata(existing?.metadata, flowData.metadata);
      const description = flowData.description || null;
      const version = flowData.version || '1.0.0';
      const isDefaultFlow = flowData.name === 'ai_assistant';

      if (existing) {
        if (seedMode === 'create') {
          summary.skipped += 1;
          continue;
        }

        // Não sobrescrever fluxos gerenciados pelo painel (admin) via seeds do filesystem.
        if (String(managedBy || '').toLowerCase() === 'admin') {
          summary.skipped += 1;
          continue;
        }

        await prisma.flowDefinition.update({
          where: { id: existing.id },
          data: {
            description,
            version,
            nodes: flowData.nodes,
            metadata,
            isDefault: isDefaultFlow,
          },
        });
        summary.updated += 1;
      } else {
        await prisma.flowDefinition.create({
          data: {
            name: flowData.name,
            description,
            version,
            nodes: flowData.nodes,
            metadata,
            isActive: true,
            isDefault: isDefaultFlow,
          },
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.errors += 1;
      logger.error('Failed to seed flow definition', {
        file: filePath,
        error: error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      });
    }
  }

  logger.info('Flow seeding finished', summary);
  return summary;
}

export default seedFlowDefinitions;
