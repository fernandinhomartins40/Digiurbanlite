import fs from 'fs';
import path from 'path';
import prisma from '../../utils/prisma';
import logger from '../../utils/logger';

type SeedSummary = {
  flowsDir: string | null;
  totalFiles: number;
  tenants: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

// Onda 8 multi-tenant (plano 2026-07-13): fluxos são POR TENANT (unique
// composta [tenantId, name]) — o seeder itera os municípios ativos para que
// cada um tenha (e possa customizar) seus próprios fluxos.
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant-default';

async function listActiveTenantIds(): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM tenants WHERE status IN ('ACTIVE', 'TRIAL') ORDER BY "createdAt" ASC
    `;
    if (rows.length > 0) return rows.map((r) => r.id);
  } catch (error) {
    // Transição: tabela tenants ausente (instalação single-tenant / migrations
    // pendentes) → semear apenas o tenant default, como antes da onda 8.
    logger.warn('Flow seeding: tabela tenants indisponível — usando tenant default', {
      error: error instanceof Error ? error.message : error,
    });
  }
  return [DEFAULT_TENANT_ID];
}

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
    tenants: 0,
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

  // Parse único dos arquivos; aplicação POR tenant.
  const flows: Array<{ filePath: string; flowData: any }> = [];
  for (const file of files) {
    const filePath = path.join(flowsDir, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8').replace(/^﻿/, '');
      const flowData = JSON.parse(raw);
      if (!flowData?.name || !Array.isArray(flowData?.nodes)) {
        summary.skipped += 1;
        logger.warn('Flow file missing required fields', { file: filePath });
        continue;
      }
      flows.push({ filePath, flowData });
    } catch (error) {
      summary.errors += 1;
      logger.error('Failed to parse flow definition file', {
        file: filePath,
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
      });
    }
  }

  const tenantIds = await listActiveTenantIds();
  summary.tenants = tenantIds.length;

  for (const tenantId of tenantIds) {
    for (const { filePath, flowData } of flows) {
      try {
        const existing = await prisma.flowDefinition.findFirst({
          where: { name: flowData.name, tenantId },
          select: { id: true, metadata: true },
        });

        // Linha legada (pré-onda 8, tenantId NULL): adotada pelo tenant default
        // em vez de duplicar o fluxo.
        const legacy = !existing && tenantId === DEFAULT_TENANT_ID
          ? await prisma.flowDefinition.findFirst({
              where: { name: flowData.name, tenantId: null },
              select: { id: true, metadata: true },
            })
          : null;
        const target = existing || legacy;

        const managedBy = isPlainObject(target?.metadata)
          ? (target!.metadata as any).managedBy
          : undefined;

        const metadata = buildMetadata(target?.metadata, flowData.metadata);
        const description = flowData.description || null;
        const version = flowData.version || '1.0.0';
        const isDefaultFlow = flowData.name === 'ai_assistant';

        if (target) {
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
            where: { id: target.id },
            data: {
              tenantId, // adota linha legada para o tenant default
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
              tenantId,
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
          tenantId,
          error: error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : error,
        });
      }
    }
  }

  logger.info('Flow seeding finished', summary);
  return summary;
}

export default seedFlowDefinitions;
