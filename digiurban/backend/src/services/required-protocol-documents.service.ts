import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { normalizeDocumentConfigs } from '../utils/document-validation';

type UploadedDoc = {
  documentType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
};

/**
 * Cria registros `protocol_documents` PENDING para documentos obrigatórios.
 * Se algum documento obrigatório já foi enviado, cria como UPLOADED ao invés de PENDING.
 *
 * Mantém a mesma semântica usada em `digiurban/backend/src/routes/citizen-services.ts`.
 */
export async function ensureRequiredProtocolDocuments(
  protocolId: string,
  service: any,
  uploadedDocs: UploadedDoc[] = []
): Promise<void> {
  if (!service?.requiredDocuments || service.requiresDocuments === false) return;

  let requiredRaw: any[] = [];
  if (typeof service.requiredDocuments === 'string') {
    try {
      requiredRaw = JSON.parse(service.requiredDocuments);
    } catch (e) {
      console.warn('Erro ao parsear requiredDocuments:', e);
      return;
    }
  } else if (Array.isArray(service.requiredDocuments)) {
    requiredRaw = service.requiredDocuments;
  }

  const configs = normalizeDocumentConfigs(requiredRaw);
  if (configs.length === 0) return;

  for (const config of configs) {
    const docName = config.name || 'Documento';

    const exists = await prisma.protocolDocument.findFirst({
      where: { protocolId, documentType: docName },
    });
    if (exists) continue;

    const matchingUpload = uploadedDocs.find((doc) => {
      const type = doc.documentType || '';
      return type === docName || type?.toLowerCase() === docName.toLowerCase();
    });

    if (matchingUpload && matchingUpload.fileUrl) {
      await prisma.protocolDocument.create({
        data: {
          protocolId,
          documentType: docName,
          isRequired: config.required ?? true,
          fileName: matchingUpload.fileName,
          fileUrl: matchingUpload.fileUrl,
          fileSize: matchingUpload.fileSize,
          mimeType: matchingUpload.mimeType,
          uploadedAt: new Date(),
          status: DocumentStatus.UPLOADED,
        },
      });
    } else {
      await prisma.protocolDocument.create({
        data: {
          protocolId,
          documentType: docName,
          isRequired: config.required ?? true,
          status: DocumentStatus.PENDING,
        },
      });
    }
  }
}

