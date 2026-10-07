/**
 * Ao subir o servidor: aplica o catálogo de modelos de documento em todo
 * município ativo (só acrescenta — não mexe no que o município editou).
 * Cobre os municípios criados antes de o catálogo existir.
 */

import { prisma } from '../lib/prisma';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import { tryGetTenantId } from '../lib/tenant-context';
import { applyDocumentTemplateCatalog } from '../catalog/document-templates';

export function initDocumentTemplatesStartup(): void {
  setTimeout(() => {
    forEachActiveTenant('document-templates-catalog', async () => {
      const tenantId = tryGetTenantId();
      if (tenantId) await applyDocumentTemplateCatalog(prisma, tenantId);
    }).catch((error) => console.error('[modelos] catálogo de modelos não aplicado:', error));
  }, 60_000);
}
