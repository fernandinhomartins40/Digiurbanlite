/**
 * ============================================================================
 * REGISTRY F3 — Backfill (materializa protocolos existentes no Registry)
 * ============================================================================
 * Lê os protocolos COM_DADOS de cada tenant e materializa EntityRecord +
 * RecordIndex a partir do customData, SEM tocar no customData (fonte de verdade
 * permanece intacta). Idempotente: re-rodar atualiza os mesmos registros.
 *
 * Pré-requisito: EntityType/FieldDefinition já populados pela F1
 *   (npx tsx scripts/registry/import-configs.ts --apply)
 *
 * Uso:
 *   npx tsx scripts/registry/backfill.ts             # dry-run (só conta)
 *   npx tsx scripts/registry/backfill.ts --apply     # materializa
 *   npx tsx scripts/registry/backfill.ts --apply --batch 500
 *
 * Requer DATABASE_URL. Escopo por tenant via forEachActiveTenant.
 * ============================================================================
 */

import { prisma } from '../../src/lib/prisma';
import { forEachActiveTenant } from '../../src/lib/tenant-iterator';
import { materializeProtocol } from '../../src/services/registry/registry-materialize.service';

const APPLY = process.argv.includes('--apply');
const batchIdx = process.argv.indexOf('--batch');
const BATCH = batchIdx >= 0 ? Math.max(50, Number(process.argv[batchIdx + 1]) || 500) : 500;

interface TenantReport {
  slug: string;
  protocols: number;
  materialized: number;
  created: number;
  updated: number;
  skipped: number;
  skippedReasons: Record<string, number>;
}

async function backfillTenant(slug: string): Promise<TenantReport> {
  const report: TenantReport = {
    slug,
    protocols: 0,
    materialized: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    skippedReasons: {},
  };

  let cursor: string | undefined;
  // Só protocolos COM_DADOS (moduleType não nulo e diferente de GENERICO)
  const baseWhere = {
    moduleType: { not: null },
    service: { is: { serviceType: 'COM_DADOS' as const } },
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await prisma.protocolSimplified.findMany({
      where: baseWhere,
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, moduleType: true, customData: true, citizenId: true, status: true },
    });
    if (batch.length === 0) break;
    cursor = batch[batch.length - 1].id;
    report.protocols += batch.length;

    if (!APPLY) continue;

    for (const p of batch) {
      const result = await materializeProtocol({
        protocolId: p.id,
        entityTypeCode: p.moduleType as string,
        customData: p.customData,
        citizenId: p.citizenId,
        // Protocolos concluídos → ACTIVE; demais → PENDING (a F5 refina).
        status: p.status === 'CONCLUIDO' ? 'ACTIVE' : 'PENDING',
      });
      if (result.skipped) {
        report.skipped++;
        report.skippedReasons[result.skipped] = (report.skippedReasons[result.skipped] ?? 0) + 1;
      } else {
        report.materialized++;
        if (result.created) report.created++;
        else report.updated++;
      }
    }
  }

  return report;
}

async function main() {
  console.log(`\n📦 Registry F3 — backfill  (${APPLY ? 'APPLY' : 'DRY-RUN'}, batch=${BATCH})\n`);

  const reports: TenantReport[] = [];
  const summary = await forEachActiveTenant('registry-backfill', async (tenant) => {
    reports.push(await backfillTenant(tenant.slug));
  });

  for (const r of reports) {
    console.log(`── tenant ${r.slug} ──`);
    console.log(`   protocolos COM_DADOS: ${r.protocols}`);
    if (APPLY) {
      console.log(`   materializados: ${r.materialized} (novos ${r.created}, atualizados ${r.updated}) | pulados: ${r.skipped}`);
      for (const [reason, n] of Object.entries(r.skippedReasons)) {
        console.log(`     ⚠️  ${reason}: ${n}`);
      }
    }
  }

  console.log(
    `\n${APPLY ? '✅ Backfill concluído' : 'ℹ️  Dry-run (nada gravado — use --apply)'} | tenants: ${summary.succeeded}/${summary.total}` +
      (summary.failed.length ? ` | falhas: ${summary.failed.length}` : '')
  );
  if (summary.failed.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no backfill Registry:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
