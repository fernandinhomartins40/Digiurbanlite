/**
 * ============================================================================
 * REGISTRY F1 — Importador de metadados (orquestrador por tenant)
 * ============================================================================
 * Popula EntityType/FieldDefinition a partir de:
 *   1) MANAGEMENT_CONFIGS (metadados de exibição/filtro hardcoded)
 *   2) ServiceSimplified.formFieldsConfig (campos de entrada dos serviços)
 *   3) CitizenCategory.triggerServices (define kind = PERSON_ROLE)
 *
 * Idempotente por [tenantId, code]. DRY-RUN por padrão.
 *
 * Uso:
 *   npx tsx scripts/registry/import-configs.ts            # dry-run (relatório)
 *   npx tsx scripts/registry/import-configs.ts --apply    # grava no banco
 *
 * Requer DATABASE_URL. Escopo por tenant via forEachActiveTenant.
 * ============================================================================
 */

import { prisma } from '../../src/lib/prisma';
import { forEachActiveTenant } from '../../src/lib/tenant-iterator';
import { getManagementConfig } from '../../src/routes/management-configs';
import { applyRegistryTypes as applyForTenant, collectRegistryTypes as collectForTenant } from '../../src/services/registry/registry-sync.service';

const APPLY = process.argv.includes('--apply');

interface TenantReport {
  slug: string;
  entityTypes: number;
  fields: number;
  personRoles: number;
  details: Array<{ code: string; kind: string; fields: number; source: string }>;
}

async function main() {
  console.log(`\n🗂️  Registry F1 — importador de metadados  (${APPLY ? 'APPLY' : 'DRY-RUN'})\n`);

  const reports: TenantReport[] = [];

  const summary = await forEachActiveTenant('registry-import', async (tenant) => {
    const types = await collectForTenant();
    const report: TenantReport = {
      slug: tenant.slug,
      entityTypes: types.length,
      fields: types.reduce((n, t) => n + t.fields.length, 0),
      personRoles: types.filter((t) => t.kind === 'PERSON_ROLE').length,
      details: types.map((t) => ({
        code: t.code,
        kind: t.kind,
        fields: t.fields.length,
        source: getManagementConfig(t.code) ? 'config+service' : 'service',
      })),
    };
    reports.push(report);

    if (APPLY) {
      await applyForTenant(types);
    }
  });

  // Relatório
  for (const r of reports) {
    console.log(`── tenant ${r.slug} ──`);
    console.log(`   EntityTypes: ${r.entityTypes} | Fields: ${r.fields} | PERSON_ROLE: ${r.personRoles}`);
    for (const d of r.details) {
      console.log(`     • ${d.code}  [${d.kind}]  ${d.fields} campos  (${d.source})`);
    }
  }

  console.log(
    `\n${APPLY ? '✅ Gravado' : 'ℹ️  Dry-run (nada gravado — use --apply)'} | tenants: ${summary.succeeded}/${summary.total}` +
      (summary.failed.length ? ` | falhas: ${summary.failed.length}` : '')
  );
  if (summary.failed.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no importador Registry:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
