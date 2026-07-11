/**
 * ============================================================================
 * SMOKE TEST — Fase E Multi-Tenant (onda 7 + RLS armado + NOT NULL lote 2)
 * ============================================================================
 *   1. DMMF: os 30 models da onda 7 entram no escopo da extension
 *   2. Isolamento: dado da onda 7 (privacidade de cidadão) carimbado e
 *      invisível cross-tenant
 *   3. Backfill: linha legada (tenantId NULL) re-derivada do dono ao
 *      reexecutar a migration (idempotência real do SQL da onda 7)
 *   4. RLS: com GUC do tenant A, raw query não vê linhas do tenant B
 *   5. NOT NULL lote 2: aplicado nas tabelas de protocolo (banco limpo)
 *
 * Uso:
 *   DATABASE_URL=... npx ts-node --transpile-only scripts/smoke-wave7.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../src/lib/prisma';
import { runAsTenant, runAsPlatform, withTenantTransaction } from '../src/lib/tenant-context';
import { getTenantScopedModels } from '../src/lib/prisma-tenant-extension';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function createTenantWithCitizen(slug: string, stamp: number) {
  return runAsPlatform(async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug, nome: `W7 ${slug}`, cnpj: `${Math.floor(Math.random() * 1e14)}`.padStart(14, '8'),
        nomeMunicipio: slug, ufMunicipio: 'SP', status: 'ACTIVE',
      } as any,
    });
    const citizen = await runAsTenant(tenant.id, async () =>
      prisma.citizen.create({
        data: {
          cpf: `${Math.floor(Math.random() * 1e11)}`.padStart(11, '6'),
          name: `Cidadão ${slug}`, email: `${slug}-${stamp}@w7.test`, password: 'x',
        },
      })
    );
    return { tenant, citizen };
  });
}

async function main(): Promise<void> {
  const stamp = Date.now();

  console.log('\n[1] DMMF: onda 7 no escopo da extension');
  const scoped = getTenantScopedModels();
  for (const model of [
    'UserSession', 'PasswordResetToken', 'PushSubscription', 'NotificationPreference',
    'FamilyComposition', 'FamilyInvite', 'CitizenPrivacySettings',
    'FaceEnrollment', 'FaceEmbedding', 'FaceRecognitionEvent', 'FaceDevice', 'FaceZone',
    'Analytics', 'KPI', 'Report', 'Dashboard', 'MetricCache', 'Prediction',
    'ServiceWorkflow', 'ModuleWorkflow', 'WorkflowDefinition', 'WorkflowInstance', 'WorkflowHistory',
  ]) {
    assert(scoped.includes(model), `${model} é tenant-scoped`);
  }
  console.log(`  (total de models escopados: ${scoped.length})`);

  console.log('\n[2] Isolamento em model da onda 7 (CitizenPrivacySettings)');
  const A = await createTenantWithCitizen(`w7a-${stamp}`, stamp);
  const B = await createTenantWithCitizen(`w7b-${stamp}`, stamp);

  const privacyA = await runAsTenant(A.tenant.id, async () =>
    prisma.citizenPrivacySettings.create({ data: { citizenId: A.citizen.id } })
  );
  assert(privacyA.tenantId === A.tenant.id, 'escrita carimbada com o tenant do contexto', String(privacyA.tenantId));

  const visibleFromB = await runAsTenant(B.tenant.id, async () =>
    prisma.citizenPrivacySettings.findFirst({ where: { citizenId: A.citizen.id } })
  );
  assert(visibleFromB === null, 'leitura cross-tenant não enxerga');

  const visibleFromA = await runAsTenant(A.tenant.id, async () =>
    prisma.citizenPrivacySettings.findFirst({ where: { citizenId: A.citizen.id } })
  );
  assert(visibleFromA !== null, 'dono enxerga o próprio registro');

  console.log('\n[3] Backfill derivado do dono (reexecução da migration da onda 7)');
  // Linha "legada": inserida por raw SQL com tenantId NULL, dona = cidadão de B
  await runAsPlatform(async () => {
    await prisma.$executeRawUnsafe(
      `INSERT INTO citizen_privacy_settings ("citizenId", "updatedAt") VALUES ($1, now())`,
      B.citizen.id
    );
  });
  const migrationSql = fs.readFileSync(
    path.join(__dirname, '..', 'prisma', 'migrations', '20260710140000_add_tenant_id_wave7', 'migration.sql'),
    'utf8'
  );
  await runAsPlatform(async () => {
    await prisma.$executeRawUnsafe(migrationSql);
  });
  const backfilled = await runAsPlatform(async () =>
    prisma.$queryRawUnsafe<Array<{ tenantId: string | null }>>(
      `SELECT "tenantId" FROM citizen_privacy_settings WHERE "citizenId" = $1`,
      B.citizen.id
    )
  );
  assert(backfilled[0]?.tenantId === B.tenant.id, 'linha legada herdou o tenant do cidadão dono', String(backfilled[0]?.tenantId));

  console.log('\n[4] RLS armado (FORCE + role não-superuser): GUC filtra raw queries');
  // Superuser/dono ignoram RLS — validar com um role de aplicação real.
  await runAsPlatform(async () => {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smoke_app') THEN
          CREATE ROLE smoke_app LOGIN PASSWORD 'smoke_app';
        END IF;
      END $$`);
    await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO smoke_app`);
    await prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smoke_app`);
  });

  const { PrismaClient } = await import('@prisma/client');
  const appUrl = (process.env.DATABASE_URL || '').replace(/\/\/[^@]+@/, '//smoke_app:smoke_app@');
  const appClient = new PrismaClient({ datasources: { db: { url: appUrl } } });

  const rawUnderGuc = async (gucTenant: string, citizenId: string): Promise<any[]> =>
    appClient.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, gucTenant);
      return tx.$queryRawUnsafe(
        `SELECT "citizenId" FROM citizen_privacy_settings WHERE "citizenId" = $1`,
        citizenId
      ) as Promise<any[]>;
    });

  const rawFromB = await rawUnderGuc(B.tenant.id, A.citizen.id);
  assert(rawFromB.length === 0, 'raw query sob GUC não vaza cross-tenant (role de app)');

  const rawFromA = await rawUnderGuc(A.tenant.id, A.citizen.id);
  assert(rawFromA.length === 1, 'raw query sob GUC vê o próprio tenant (role de app)');

  const rawNoGuc: any[] = await appClient.$queryRawUnsafe(
    `SELECT "citizenId" FROM citizen_privacy_settings WHERE "citizenId" = $1`,
    A.citizen.id
  );
  assert(rawNoGuc.length === 1, 'sem GUC a política permissiva passa (migrations/seeds intactos)');

  await appClient.$disconnect();

  console.log('\n[5] NOT NULL lote 2 aplicado (banco sem resíduo NULL)');
  const notNullCols = await runAsPlatform(async () =>
    prisma.$queryRawUnsafe<Array<{ table_name: string; is_nullable: string }>>(
      `SELECT table_name, is_nullable FROM information_schema.columns
       WHERE column_name = 'tenantId'
         AND table_name IN ('protocol_documents','protocol_sla','citizen_documents','generated_documents')`
    )
  );
  for (const row of notNullCols) {
    assert(row.is_nullable === 'NO', `${row.table_name}.tenantId é NOT NULL`);
  }

  // Cleanup
  await runAsPlatform(async () => {
    await prisma.citizenPrivacySettings.deleteMany({
      where: { citizenId: { in: [A.citizen.id, B.citizen.id] } },
    });
    for (const w of [A, B]) {
      await prisma.citizen.deleteMany({ where: { tenantId: w.tenant.id } });
      await prisma.tenant.delete({ where: { id: w.tenant.id } });
    }
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal no smoke:', error);
  process.exit(1);
});
