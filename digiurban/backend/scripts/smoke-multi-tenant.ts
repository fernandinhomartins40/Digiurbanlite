/**
 * ============================================================================
 * SMOKE TEST MULTI-TENANT (Fase 7 do plano 2026-07-13)
 * ============================================================================
 * Valida o isolamento entre 2 tenants efêmeros direto contra o banco:
 *   1. Escrita escopada: create no tenant A injeta tenantId A;
 *   2. Leitura escopada: B não enxerga registro de A (findFirst/count);
 *   3. Mutação cross-tenant: update por id de registro alheio → P2025;
 *   4. Fluxos do bot por tenant (FlowDefinition, onda 8);
 *   5. Cobertura DMMF: models da onda 8 presentes em getTenantScopedModels().
 *
 * Uso:  npx tsx scripts/smoke-multi-tenant.ts   (requer DATABASE_URL)
 * Sai com código 1 se qualquer verificação falhar — usável em CI.
 */

import { prisma } from '../src/lib/prisma';
import { runAsTenant, runAsPlatform } from '../src/lib/tenant-context';
import { getTenantScopedModels } from '../src/lib/prisma-tenant-extension';

const STAMP = Date.now();
const SLUG_A = `smoke-a-${STAMP}`;
const SLUG_B = `smoke-b-${STAMP}`;

let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    console.log(`  ✅ ${label}`);
  } else {
    failures += 1;
    console.error(`  ❌ ${label}`, detail ?? '');
  }
}

async function main() {
  console.log('🧪 Smoke multi-tenant — criando tenants efêmeros...');

  // 5. Cobertura DMMF (não precisa de banco)
  const scoped = new Set(getTenantScopedModels());
  for (const model of ['EspecialidadeMedica', 'FlowDefinition', 'AlunoRota', 'DestinoTFD', 'ConfiguracaoESUS']) {
    check(`extension cobre ${model} (onda 8)`, scoped.has(model));
  }

  const [tenantA, tenantB] = await runAsPlatform(async () =>
    Promise.all(
      [SLUG_A, SLUG_B].map((slug, i) =>
        prisma.tenant.create({
          data: {
            slug,
            nome: `Smoke ${slug}`,
            cnpj: `00.000.000/000${i + 1}-${String(STAMP).slice(-2)}`,
            nomeMunicipio: `Smoke ${slug}`,
            ufMunicipio: 'PR',
            status: 'ACTIVE',
          },
          select: { id: true, slug: true },
        })
      )
    )
  );

  const cleanup: Array<() => Promise<unknown>> = [];
  cleanup.push(() =>
    runAsPlatform(async () => {
      await prisma.especialidadeMedica.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
      await prisma.flowDefinition.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
      await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
    })
  );

  try {
    // 1. Escrita escopada
    const espName = `SMOKE-ESP-${STAMP}`;
    const created = await runAsTenant(tenantA.id, async () =>
      prisma.especialidadeMedica.create({ data: { nome: espName } })
    );
    check('create injeta tenantId do contexto', created.tenantId === tenantA.id, created.tenantId);

    // 2. Leitura escopada
    const seenByB = await runAsTenant(tenantB.id, async () =>
      prisma.especialidadeMedica.findFirst({ where: { nome: espName } })
    );
    check('tenant B NÃO enxerga registro do A (findFirst)', seenByB === null);

    const countB = await runAsTenant(tenantB.id, async () =>
      prisma.especialidadeMedica.count({ where: { nome: espName } })
    );
    check('tenant B NÃO conta registro do A (count)', countB === 0);

    const seenByA = await runAsTenant(tenantA.id, async () =>
      prisma.especialidadeMedica.findFirst({ where: { nome: espName } })
    );
    check('tenant A enxerga o próprio registro', seenByA?.id === created.id);

    // 2b. Mesmo nome pode existir nos dois tenants (unique composta)
    const dupInB = await runAsTenant(tenantB.id, async () =>
      prisma.especialidadeMedica.create({ data: { nome: espName } })
    );
    check('mesmo nome de catálogo permitido em outro tenant', dupInB.tenantId === tenantB.id);

    // 3. Mutação cross-tenant bloqueada (preflight de ownership → P2025)
    let crossBlocked = false;
    try {
      await runAsTenant(tenantB.id, async () =>
        prisma.especialidadeMedica.update({ where: { id: created.id }, data: { descricao: 'hack' } })
      );
    } catch (error: any) {
      crossBlocked = error?.code === 'P2025';
    }
    check('update cross-tenant por id bloqueado (P2025)', crossBlocked);

    // 4. FlowDefinition por tenant
    const flowName = `smoke-flow-${STAMP}`;
    await runAsTenant(tenantA.id, async () =>
      prisma.flowDefinition.create({ data: { name: flowName, nodes: [] } })
    );
    const flowInB = await runAsTenant(tenantB.id, async () =>
      prisma.flowDefinition.findFirst({ where: { name: flowName } })
    );
    check('fluxo do bot do tenant A invisível no B', flowInB === null);
    const flowDupB = await runAsTenant(tenantB.id, async () =>
      prisma.flowDefinition.create({ data: { name: flowName, nodes: [] } })
    );
    check('mesmo nome de fluxo permitido em outro tenant', flowDupB.tenantId === tenantB.id);
  } finally {
    console.log('🧹 Limpando tenants efêmeros...');
    for (const fn of cleanup) {
      await fn().catch((e) => console.error('  ⚠️ cleanup:', e?.message || e));
    }
  }

  if (failures > 0) {
    console.error(`\n❌ Smoke multi-tenant FALHOU (${failures} verificações)`);
    process.exit(1);
  }
  console.log('\n✅ Smoke multi-tenant PASSOU');
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no smoke multi-tenant:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
