/**
 * Ao subir o servidor: os serviços já gravados nos municípios passam a pedir os
 * documentos pelo catálogo único (shared/constants/required-documents.ts) —
 * "RG", "RG e CPF", "Documentos Pessoais" viram o mesmo "Documento de identidade".
 * Só troca nomes conhecidos; o que o município inventou fica. Idempotente.
 * Serviço do catálogo que o município não editou continua "não editado".
 */

import { prisma } from '../lib/prisma';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import { catalogHashOf } from '../catalog/services';
import { normalizeRequiredDocumentList } from '../catalog/documents/normalize';

export async function standardizeServiceDocuments(db: any): Promise<number> {
  const services: any[] = await db.serviceSimplified.findMany();
  let updated = 0;
  for (const service of services) {
    const { documents, changed } = normalizeRequiredDocumentList(service.requiredDocuments);
    if (!changed) continue;
    const untouched = Boolean(service.catalogHash) && service.catalogHash === catalogHashOf(service);
    await db.serviceSimplified.update({
      where: { id: service.id },
      data: {
        requiredDocuments: documents as any,
        ...(untouched ? { catalogHash: catalogHashOf({ ...service, requiredDocuments: documents }) } : {}),
      },
    });
    updated += 1;
  }
  return updated;
}

export function initRequiredDocumentsStartup(): void {
  setTimeout(() => {
    forEachActiveTenant('required-documents-standard', async () => {
      const updated = await standardizeServiceDocuments(prisma as any);
      if (updated) console.log(`[documentos] ${updated} serviço(s) passaram a usar os documentos padrão`);
    }).catch((error) => console.error('[documentos] padronização não concluída:', error));
  }, 40_000);
}
