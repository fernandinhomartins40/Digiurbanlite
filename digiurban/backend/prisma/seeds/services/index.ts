/**
 * Seed de serviços (seed-consolidated e scripts). O catálogo mora em
 * src/catalog/services — este arquivo só repassa.
 */
import { PrismaClient } from '@prisma/client';
import { allServices, applyServiceCatalog } from '../../../src/catalog/services';
import { DEFAULT_TENANT_ID } from '../../../src/lib/tenant-context';

export { allServices };

export async function seedServices(db: any = new PrismaClient(), tenantId: string = DEFAULT_TENANT_ID) {
  console.log(`\n📦 Catálogo de serviços (município ${tenantId})...`);
  const result = await applyServiceCatalog(db, tenantId, { log: true });
  console.log(`✅ Catálogo: +${result.created} criados, ${result.updated} atualizados, ${result.keptEdited} editados pelo município (mantidos)`);
  return result.created;
}
