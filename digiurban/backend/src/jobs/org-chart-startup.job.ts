/**
 * Ao subir o servidor: toda secretaria de todo município ativo tem a sua
 * unidade raiz no organograma (idempotente — só cria o que falta). Cobre os
 * municípios criados antes de o provisionamento fazer isso.
 */

import { prisma } from '../lib/prisma';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import { syncDepartmentRootOrganizationalUnits } from '../services/department-organogram.service';

export function initOrgChartStartupSync(): void {
  setTimeout(() => {
    forEachActiveTenant('org-chart-root-units', async () => {
      await syncDepartmentRootOrganizationalUnits(prisma as any, { missingOnly: true });
    }).catch((error) => console.error('[org-chart] unidades raiz não sincronizadas:', error));
  }, 30_000);
}
