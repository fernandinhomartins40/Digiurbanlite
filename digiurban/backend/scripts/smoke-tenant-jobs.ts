/**
 * ============================================================================
 * SMOKE TEST — Fase A Multi-Tenant (jobs/filas tenant-aware)
 * ============================================================================
 * Valida o forEachActiveTenant (lib/tenant-iterator.ts):
 *   1. Itera todos os tenants ACTIVE/TRIAL — e SOMENTE eles (suspenso fica fora)
 *   2. Dentro do callback, o contexto ALS escopa as queries ao tenant da vez
 *   3. Falha em um tenant não aborta os demais (resumo com failed)
 *
 * Uso:
 *   DATABASE_URL=postgresql://... npx ts-node --transpile-only scripts/smoke-tenant-jobs.ts
 */

import { prisma } from '../src/lib/prisma';
import { runAsPlatform, DEFAULT_TENANT_ID } from '../src/lib/tenant-context';
import { forEachActiveTenant } from '../src/lib/tenant-iterator';

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

async function main(): Promise<void> {
  const stamp = Date.now();
  const slugA = `smoke-jobs-a-${stamp}`;
  const slugB = `smoke-jobs-b-${stamp}`;
  const slugSusp = `smoke-jobs-susp-${stamp}`;

  // Garantir o tenant default (instalação limpa)
  await runAsPlatform(async () => {
    await prisma.tenant.upsert({
      where: { id: DEFAULT_TENANT_ID },
      update: {},
      create: {
        id: DEFAULT_TENANT_ID,
        slug: 'default',
        nome: 'Default',
        cnpj: '00000000000000',
        nomeMunicipio: 'Default',
        ufMunicipio: 'SP',
        status: 'ACTIVE',
      } as any,
    });
  });

  console.log('\n[setup] 2 tenants ativos + 1 suspenso, 1 department em cada ativo');
  const [tenantA, tenantB, tenantSusp] = await runAsPlatform(async () => {
    const a = await prisma.tenant.create({
      data: {
        slug: slugA, nome: 'Smoke Jobs A', cnpj: `11${stamp}`.slice(0, 14),
        nomeMunicipio: 'Cidade A', ufMunicipio: 'SP', status: 'ACTIVE',
      } as any,
    });
    const b = await prisma.tenant.create({
      data: {
        slug: slugB, nome: 'Smoke Jobs B', cnpj: `22${stamp}`.slice(0, 14),
        nomeMunicipio: 'Cidade B', ufMunicipio: 'RJ', status: 'TRIAL',
      } as any,
    });
    const s = await prisma.tenant.create({
      data: {
        slug: slugSusp, nome: 'Smoke Jobs Suspenso', cnpj: `33${stamp}`.slice(0, 14),
        nomeMunicipio: 'Cidade S', ufMunicipio: 'MG', status: 'SUSPENDED',
      } as any,
    });
    await prisma.department.create({
      data: { name: `Secretaria Smoke ${stamp}`, tenantId: a.id },
    });
    await prisma.department.create({
      data: { name: `Secretaria Smoke ${stamp}`, tenantId: b.id },
    });
    return [a, b, s];
  });

  console.log('\n[1] forEachActiveTenant itera ativos/trial e pula suspenso');
  const seen: string[] = [];
  const deptCounts = new Map<string, number>();

  const summary = await forEachActiveTenant('smoke-jobs', async (tenant) => {
    seen.push(tenant.id);
    // Query SEM filtro explícito — a extension deve escopar ao tenant da vez
    const count = await prisma.department.count({
      where: { name: `Secretaria Smoke ${stamp}` },
    });
    deptCounts.set(tenant.id, count);
  });

  assert(seen.includes(tenantA.id), 'tenant ACTIVE iterado');
  assert(seen.includes(tenantB.id), 'tenant TRIAL iterado');
  assert(!seen.includes(tenantSusp.id), 'tenant SUSPENDED NÃO iterado');
  assert(summary.total === seen.length, 'summary.total consistente');
  assert(summary.failed.length === 0, 'nenhuma falha', JSON.stringify(summary.failed));

  console.log('\n[2] contexto escopa as queries dentro do callback');
  assert(deptCounts.get(tenantA.id) === 1, 'tenant A vê exatamente 1 department', `viu ${deptCounts.get(tenantA.id)}`);
  assert(deptCounts.get(tenantB.id) === 1, 'tenant B vê exatamente 1 department', `viu ${deptCounts.get(tenantB.id)}`);
  const defaultCount = deptCounts.get(DEFAULT_TENANT_ID);
  if (defaultCount !== undefined) {
    assert(defaultCount === 0, 'tenant default NÃO vê os departments dos outros', `viu ${defaultCount}`);
  }

  console.log('\n[3] falha em um tenant não aborta os demais');
  let executions = 0;
  const summary2 = await forEachActiveTenant('smoke-jobs-fail', async (tenant) => {
    executions++;
    if (tenant.id === tenantA.id) throw new Error('falha proposital');
  });
  assert(executions === summary2.total, 'todos os tenants executaram apesar da falha');
  assert(summary2.failed.length === 1 && summary2.failed[0].tenantId === tenantA.id,
    'falha registrada no resumo para o tenant certo');
  assert(summary2.succeeded === summary2.total - 1, 'succeeded = total - 1');

  // Cleanup
  await runAsPlatform(async () => {
    await prisma.department.deleteMany({ where: { name: `Secretaria Smoke ${stamp}` } });
    await prisma.tenant.deleteMany({ where: { slug: { in: [slugA, slugB, slugSusp] } } });
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal no smoke:', error);
  process.exit(1);
});
