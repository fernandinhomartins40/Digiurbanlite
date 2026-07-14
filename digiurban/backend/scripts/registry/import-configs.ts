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
import {
  buildEntityType,
  knownManagementModuleTypes,
  type ImportedEntityType,
} from '../../src/services/registry/registry-import.service';
import { getManagementConfig } from '../../src/routes/management-configs';
import type { EntityKind } from '../../src/services/registry/registry.types';

const APPLY = process.argv.includes('--apply');

interface TenantReport {
  slug: string;
  entityTypes: number;
  fields: number;
  personRoles: number;
  details: Array<{ code: string; kind: string; fields: number; source: string }>;
}

/**
 * Descobre os moduleTypes de um tenant: união dos configs hardcoded com os
 * moduleTypes reais dos serviços COM_DADOS. Para cada um, monta o EntityType.
 */
async function collectForTenant(): Promise<ImportedEntityType[]> {
  // Serviços COM_DADOS com moduleType (a extension já escopa por tenant)
  const services = await prisma.serviceSimplified.findMany({
    where: { serviceType: 'COM_DADOS', moduleType: { not: null } },
    select: { name: true, departmentId: true, moduleType: true, formFieldsConfig: true },
  });

  // Categorias e seus triggerServices → mapa moduleType → kind PERSON_ROLE
  const categories = await prisma.citizenCategory.findMany({
    select: { triggerServices: true },
  });
  const personRoleModules = new Set<string>();
  for (const c of categories) {
    for (const m of c.triggerServices ?? []) personRoleModules.add(m);
  }

  // União de moduleTypes: dos serviços + dos configs hardcoded
  const moduleTypes = new Set<string>(knownManagementModuleTypes());
  for (const s of services) if (s.moduleType) moduleTypes.add(s.moduleType);

  const result: ImportedEntityType[] = [];
  for (const moduleType of moduleTypes) {
    const config = getManagementConfig(moduleType);
    const svcs = services.filter((s) => s.moduleType === moduleType);
    // Só cria EntityType se houver alguma fonte de campos (config ou serviço).
    if (!config && svcs.length === 0) continue;
    const kind: EntityKind | null = personRoleModules.has(moduleType) ? 'PERSON_ROLE' : null;
    result.push(buildEntityType(moduleType, config, svcs, kind));
  }
  return result;
}

async function applyForTenant(types: ImportedEntityType[]): Promise<void> {
  for (const t of types) {
    // Upsert do EntityType por [tenantId, code]. A extension injeta tenantId;
    // por isso usamos findFirst + create/update (findUnique com unique composta
    // por tenant não compila — ver CLAUDE.md).
    const existing = await prisma.entityType.findFirst({ where: { code: t.code } });
    const entityType = existing
      ? await prisma.entityType.update({
          where: { id: existing.id },
          data: {
            name: t.name,
            kind: t.kind,
            department: t.department,
            materializesFrom: t.materializesFrom,
          },
        })
      : await prisma.entityType.create({
          data: {
            code: t.code,
            name: t.name,
            kind: t.kind,
            department: t.department,
            materializesFrom: t.materializesFrom,
          },
        });

    // Upsert de cada FieldDefinition por [tenantId, entityTypeId, key].
    for (const f of t.fields) {
      const existingField = await prisma.fieldDefinition.findFirst({
        where: { entityTypeId: entityType.id, key: f.key },
      });
      const data = {
        label: f.label,
        dataType: f.dataType,
        required: f.required,
        indexable: f.indexable,
        filterable: f.filterable,
        facetable: f.facetable,
        searchable: f.searchable,
        isMetric: f.isMetric,
        aggregation: f.aggregation,
        isPII: f.isPII,
        displayInTable: f.displayInTable,
        displayInCard: f.displayInCard,
        order: f.order,
      };
      if (existingField) {
        await prisma.fieldDefinition.update({ where: { id: existingField.id }, data });
      } else {
        await prisma.fieldDefinition.create({
          data: { entityTypeId: entityType.id, key: f.key, ...data },
        });
      }
    }
  }
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
