/**
 * ============================================================================
 * SMOKE TEST — Multi-Tenant Fases 1/2 (semente da tenant-isolation suite)
 * ============================================================================
 * Executa asserções contra um banco real (DATABASE_URL):
 *   1. Migration/backfill: tenants existe e tem o tenant default
 *   2. Extension de escrita: create sem tenantId → preenchido pelo contexto ALS
 *   3. Extension: tenantId explícito nunca é sobrescrito
 *   4. createMany: todos os itens carimbados
 *   5. runAsPlatform: NÃO injeta (comportamento de plataforma)
 *   6. Modelos escopados detectados via DMMF (onda 1 = 5 models)
 *
 * Uso:
 *   DATABASE_URL=postgresql://... npx ts-node --transpile-only scripts/smoke-tenant.ts
 */

import { prisma } from '../src/lib/prisma';
import { runAsTenant, runAsPlatform, DEFAULT_TENANT_ID } from '../src/lib/tenant-context';
import { getTenantScopedModels } from '../src/lib/prisma-tenant-extension';
import { TenantService as TenantServiceClass } from '../src/services/tenant.service';

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

  console.log('\n[1] Modelos escopados (DMMF)');
  const scoped = getTenantScopedModels();
  console.log(`  detectados: ${scoped.join(', ')}`);
  for (const expected of [
    // onda 1
    'User', 'Citizen', 'Department', 'ServiceSimplified', 'ProtocolSimplified',
    // onda 2 (família de protocolo)
    'ProtocolHistorySimplified', 'ProtocolEvaluationSimplified', 'ProtocolSLA',
    'ProtocolDocument', 'ProtocolInteraction', 'ProtocolPending',
  ]) {
    assert(scoped.includes(expected), `${expected} é tenant-scoped`);
  }

  console.log('\n[2] Tenant default (migration 20260707120000)');
  const tenant = await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {},
    create: {
      id: DEFAULT_TENANT_ID,
      slug: 'default',
      nome: 'Smoke Test City',
      cnpj: `00.000.${stamp % 1000}/0001-00`,
      nomeMunicipio: 'SmokeCity',
      ufMunicipio: 'SP',
    },
  });
  assert(tenant.id === DEFAULT_TENANT_ID, 'tenant default existe/criado');

  const tenantB = await prisma.tenant.upsert({
    where: { slug: 'smoke-b' },
    update: {},
    create: {
      slug: 'smoke-b',
      nome: 'Tenant B',
      cnpj: `11.111.${stamp % 1000}/0001-11`,
      nomeMunicipio: 'CidadeB',
      ufMunicipio: 'RJ',
    },
  });

  console.log('\n[3] Escrita SEM tenantId dentro de runAsTenant → injetado');
  const dept = await runAsTenant(tenantB.id, async () =>
    await prisma.department.create({
      data: { name: `Secretaria Smoke ${stamp}` },
    })
  );
  assert(dept.tenantId === tenantB.id, 'department.create herda tenant do contexto', `got ${dept.tenantId}`);

  console.log('\n[4] Escrita COM tenantId explícito → preservado');
  const dept2 = await runAsTenant(tenantB.id, async () =>
    await prisma.department.create({
      data: { name: `Secretaria Explicita ${stamp}`, tenantId: DEFAULT_TENANT_ID },
    })
  );
  assert(dept2.tenantId === DEFAULT_TENANT_ID, 'tenantId explícito não é sobrescrito', `got ${dept2.tenantId}`);

  console.log('\n[5] createMany → todos carimbados');
  await runAsTenant(tenantB.id, async () =>
    await prisma.citizen.createMany({
      data: [
        { cpf: `9${stamp}`.slice(0, 11), name: 'Cidadão Smoke 1', email: `s1-${stamp}@x.dev`, password: 'x' },
        { cpf: `8${stamp}`.slice(0, 11), name: 'Cidadão Smoke 2', email: `s2-${stamp}@x.dev`, password: 'x' },
      ],
    })
  );
  // Releitura DENTRO do contexto do tenant B (o filtro de leitura da Fase 3
  // esconderia estes registros de qualquer outro contexto — comportamento [8+])
  const citizens = await runAsTenant(tenantB.id, async () =>
    await prisma.citizen.findMany({ where: { email: { endsWith: `${stamp}@x.dev` } } })
  );
  assert(citizens.length === 2 && citizens.every((c) => c.tenantId === tenantB.id), 'createMany carimba todos');

  console.log('\n[6] runAsPlatform → NÃO injeta');
  const deptPlat = await runAsPlatform(async () =>
    await prisma.department.create({ data: { name: `Plataforma ${stamp}` } })
  );
  assert(deptPlat.tenantId === null, 'escrita de plataforma fica sem tenant', `got ${deptPlat.tenantId}`);

  console.log('\n[7] Fora de qualquer contexto → fail-soft para default (Fase 2)');
  const deptNoCtx = await prisma.department.create({ data: { name: `SemCtx ${stamp}` } });
  assert(deptNoCtx.tenantId === DEFAULT_TENANT_ID, 'sem contexto usa tenant default', `got ${deptNoCtx.tenantId}`);

  // ==========================================================================
  // FASE 3 — ISOLAMENTO DE LEITURA/MUTAÇÃO (tenant-isolation suite)
  // ==========================================================================

  console.log('\n[8] Leitura: tenant A não enxerga dados do tenant B');
  const seenFromDefault = await runAsTenant(DEFAULT_TENANT_ID, async () =>
    await prisma.department.findMany({ where: { name: `Secretaria Smoke ${stamp}` } })
  );
  assert(seenFromDefault.length === 0, 'findMany não vaza registro de outro tenant');

  const seenFromB = await runAsTenant(tenantB.id, async () =>
    await prisma.department.findMany({ where: { name: `Secretaria Smoke ${stamp}` } })
  );
  assert(seenFromB.length === 1, 'findMany devolve o registro ao dono');

  console.log('\n[9] findUnique reescrito com escopo de tenant');
  const uniqueCross = await runAsTenant(DEFAULT_TENANT_ID, async () =>
    await prisma.department.findUnique({ where: { id: dept.id } })
  );
  assert(uniqueCross === null, 'findUnique por id de outro tenant retorna null', `got ${uniqueCross?.id}`);

  const uniqueOwn = await runAsTenant(tenantB.id, async () =>
    await prisma.department.findUnique({ where: { id: dept.id } })
  );
  assert(uniqueOwn?.id === dept.id, 'findUnique devolve ao dono');

  console.log('\n[10] count escopado');
  const countB = await runAsTenant(tenantB.id, async () =>
    await prisma.citizen.count({ where: { email: { endsWith: `${stamp}@x.dev` } } })
  );
  const countDefault = await runAsTenant(DEFAULT_TENANT_ID, async () =>
    await prisma.citizen.count({ where: { email: { endsWith: `${stamp}@x.dev` } } })
  );
  assert(countB === 2 && countDefault === 0, 'count respeita o tenant', `B=${countB} default=${countDefault}`);

  console.log('\n[11] update/delete cross-tenant bloqueados (preflight)');
  let updateBlocked = false;
  try {
    await runAsTenant(DEFAULT_TENANT_ID, async () =>
      await prisma.department.update({ where: { id: dept.id }, data: { name: 'hacked' } })
    );
  } catch {
    updateBlocked = true;
  }
  assert(updateBlocked, 'update de registro alheio lança erro');

  let deleteBlocked = false;
  try {
    await runAsTenant(DEFAULT_TENANT_ID, async () =>
      await prisma.department.delete({ where: { id: dept.id } })
    );
  } catch {
    deleteBlocked = true;
  }
  assert(deleteBlocked, 'delete de registro alheio lança erro');

  console.log('\n[12] upsert não sequestra registro de outro tenant');
  let upsertBlocked = false;
  try {
    await runAsTenant(DEFAULT_TENANT_ID, async () =>
      await prisma.department.upsert({
        where: { id: dept.id },
        update: { name: 'hijacked' },
        create: { name: `Nunca ${stamp}` },
      })
    );
  } catch {
    upsertBlocked = true;
  }
  assert(upsertBlocked, 'upsert cross-tenant bloqueado');

  console.log('\n[13] updateMany/deleteMany escopados (0 linhas fora do tenant)');
  const um = await runAsTenant(DEFAULT_TENANT_ID, async () =>
    await prisma.citizen.updateMany({
      where: { email: { endsWith: `${stamp}@x.dev` } },
      data: { name: 'hacked' },
    })
  );
  assert(um.count === 0, 'updateMany não toca registros de outro tenant', `count=${um.count}`);

  console.log('\n[15] Resolução de tenant por host (Fase 4)');
  process.env.TENANT_BASE_DOMAIN = 'digiurban.test';
  await runAsPlatform(async () => {
    await prisma.tenant.update({
      where: { id: tenantB.id },
      data: { customDomain: `portal-b-${stamp}.example.org` },
    });
  });
  TenantServiceClass.invalidate();

  const bySub = await TenantServiceClass.getByHost('smoke-b.digiurban.test');
  assert(bySub?.id === tenantB.id, 'subdomínio {slug}.BASE resolve o tenant', `got ${bySub?.slug}`);

  const byCustom = await TenantServiceClass.getByHost(`portal-b-${stamp}.example.org`);
  assert(byCustom?.id === tenantB.id, 'customDomain resolve o tenant', `got ${byCustom?.slug}`);

  const byUnknown = await TenantServiceClass.getByHost('desconhecido.outra.coisa');
  assert(byUnknown?.id === DEFAULT_TENANT_ID, 'host desconhecido → default (transição)', `got ${byUnknown?.slug}`);

  const byReserved = await TenantServiceClass.getByHost('www.digiurban.test');
  assert(byReserved?.id === DEFAULT_TENANT_ID, 'subdomínio reservado (www) → default', `got ${byReserved?.slug}`);

  console.log('\n[14] Plataforma enxerga tudo (runAsPlatform sem filtro)');
  const platView = await runAsPlatform(async () =>
    await prisma.department.findMany({ where: { name: { contains: `${stamp}` } } })
  );
  assert(platView.length >= 3, 'plataforma vê registros de todos os tenants', `got ${platView.length}`);

  // Limpeza dos artefatos do smoke (como plataforma, sem escopo)
  await runAsPlatform(async () => {
    await prisma.department.deleteMany({ where: { name: { contains: `${stamp}` } } });
    await prisma.citizen.deleteMany({ where: { email: { endsWith: `${stamp}@x.dev` } } });
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((err) => {
    console.error('SMOKE FALHOU:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
