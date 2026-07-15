/**
 * ============================================================================
 * Backfill do catálogo completo de serviços em tenants existentes
 * ============================================================================
 * Corrige tenants que foram provisionados ANTES da correção do Bug A (nasceram
 * só com os 12 serviços genéricos). Semeia o catálogo completo (400+) em cada
 * tenant ativo, idempotente (não duplica os que já existem).
 *
 * Uso:
 *   npx tsx scripts/backfill-tenant-services.ts            # dry-run (lista)
 *   npx tsx scripts/backfill-tenant-services.ts --apply    # semeia
 *   npx tsx scripts/backfill-tenant-services.ts --apply --tenant <slug>
 *
 * Requer DATABASE_URL.
 * ============================================================================
 */

import { prisma } from '../src/lib/prisma';
import { runAsPlatform, runAsTenant } from '../src/lib/tenant-context';
import { seedServices } from '../prisma/seeds/services/index';

const APPLY = process.argv.includes('--apply');
const tIdx = process.argv.indexOf('--tenant');
const ONLY_SLUG = tIdx >= 0 ? process.argv[tIdx + 1] : undefined;

async function main() {
  console.log(`\n🗂️  Backfill de catálogo de serviços  (${APPLY ? 'APPLY' : 'DRY-RUN'})${ONLY_SLUG ? ` — tenant ${ONLY_SLUG}` : ''}\n`);

  const tenants = await runAsPlatform(async () =>
    prisma.tenant.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] as any }, ...(ONLY_SLUG ? { slug: ONLY_SLUG } : {}) },
      select: { id: true, slug: true },
      orderBy: { createdAt: 'asc' },
    })
  );

  for (const t of tenants) {
    const before = await runAsTenant(t.id, async () => prisma.serviceSimplified.count());
    if (!APPLY) {
      console.log(`── ${t.slug}: ${before} serviços atualmente (dry-run, use --apply)`);
      continue;
    }
    const created = await runAsTenant(t.id, async () => seedServices(prisma, t.id));
    const after = await runAsTenant(t.id, async () => prisma.serviceSimplified.count());
    console.log(`── ${t.slug}: ${before} → ${after} serviços (+${created} criados)`);
  }

  console.log(`\n${APPLY ? '✅ Concluído' : 'ℹ️  Dry-run'} | tenants: ${tenants.length}`);
}

main()
  .catch((e) => { console.error('❌ Erro:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
