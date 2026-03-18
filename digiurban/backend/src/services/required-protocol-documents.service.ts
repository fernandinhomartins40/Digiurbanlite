import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { normalizeDocumentConfigs } from '../utils/document-validation';
import { matchDocumentType, resolveCanonicalDocumentType } from '../utils/document-mapping';
import * as pendingService from './protocol-pending.service';

type UploadedDoc = {
  documentType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
};

type ProtocolServiceLike = {
  id?: string;
  requiresDocuments?: boolean | null;
  requiredDocuments?: unknown;
};

function getRequiredDocumentConfigs(service: ProtocolServiceLike | null | undefined) {
  if (!service?.requiredDocuments || service.requiresDocuments === false) {
    return [];
  }

  let requiredRaw: any[] = [];
  if (typeof service.requiredDocuments === 'string') {
    try {
      requiredRaw = JSON.parse(service.requiredDocuments);
    } catch (error) {
      console.warn('Erro ao parsear requiredDocuments:', error);
      return [];
    }
  } else if (Array.isArray(service.requiredDocuments)) {
    requiredRaw = service.requiredDocuments;
  }

  return normalizeDocumentConfigs(requiredRaw).filter((config) => Boolean(config?.name));
}

async function loadProtocolService(protocolId: string): Promise<ProtocolServiceLike | null> {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: {
      service: {
        select: {
          id: true,
          requiresDocuments: true,
          requiredDocuments: true,
        },
      },
    },
  });

  return protocol?.service || null;
}

async function reconcileProtocolDocuments(
  protocolId: string,
  service: ProtocolServiceLike,
): Promise<void> {
  const configs = getRequiredDocumentConfigs(service);
  if (configs.length === 0) return;

  const requiredNames = configs.map((config) => String(config.name));

  await prisma.$transaction(async (tx) => {
    const documents = await tx.protocolDocument.findMany({
      where: { protocolId },
      orderBy: { createdAt: 'asc' },
    });

    const mutableDocs = [...documents];

    for (const document of documents) {
      const canonicalType = [document.documentType, document.fileName, document.fileUrl]
        .map((value) => (value ? resolveCanonicalDocumentType(String(value), requiredNames) : undefined))
        .find(Boolean);

      if (!canonicalType || document.documentType === canonicalType) {
        continue;
      }

      const existingCanonical = mutableDocs.find(
        (item) => item.id !== document.id && item.documentType === canonicalType,
      );

      if (existingCanonical && !existingCanonical.fileUrl && document.fileUrl) {
        await tx.protocolDocument.update({
          where: { id: existingCanonical.id },
          data: {
            documentType: canonicalType,
            isRequired: true,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            uploadedBy: document.uploadedBy,
            uploadedAt: document.uploadedAt,
            status: document.status,
            validatedBy: document.validatedBy,
            validatedAt: document.validatedAt,
            rejectionReason: document.rejectionReason,
            rejectedAt: document.rejectedAt,
          },
        });

        await tx.protocolDocument.delete({ where: { id: document.id } });

        const targetIndex = mutableDocs.findIndex((item) => item.id === existingCanonical.id);
        if (targetIndex >= 0) {
          mutableDocs[targetIndex] = {
            ...mutableDocs[targetIndex],
            documentType: canonicalType,
            isRequired: true,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            uploadedBy: document.uploadedBy,
            uploadedAt: document.uploadedAt,
            status: document.status,
            validatedBy: document.validatedBy,
            validatedAt: document.validatedAt,
            rejectionReason: document.rejectionReason,
            rejectedAt: document.rejectedAt,
          };
        }

        const sourceIndex = mutableDocs.findIndex((item) => item.id === document.id);
        if (sourceIndex >= 0) {
          mutableDocs.splice(sourceIndex, 1);
        }

        continue;
      }

      if (!existingCanonical) {
        await tx.protocolDocument.update({
          where: { id: document.id },
          data: {
            documentType: canonicalType,
            isRequired: true,
          },
        });

        const sourceIndex = mutableDocs.findIndex((item) => item.id === document.id);
        if (sourceIndex >= 0) {
          mutableDocs[sourceIndex] = {
            ...mutableDocs[sourceIndex],
            documentType: canonicalType,
            isRequired: true,
          };
        }
      }
    }
  });
}

/**
 * Reconciles document names already persisted in the protocol with the current
 * required document configuration.
 */
export async function syncProtocolRequiredDocuments(
  protocolId: string,
  service?: ProtocolServiceLike | null,
): Promise<void> {
  const resolvedService = service || (await loadProtocolService(protocolId));
  if (!resolvedService) return;

  await reconcileProtocolDocuments(protocolId, resolvedService);
  await ensureRequiredProtocolDocuments(protocolId, resolvedService);
}

/**
 * Creates PENDING protocol_documents for required documents that are still missing.
 * If an uploaded document already matches the requirement, it creates the record as UPLOADED.
 */
export async function ensureRequiredProtocolDocuments(
  protocolId: string,
  service: ProtocolServiceLike,
  uploadedDocs: UploadedDoc[] = [],
): Promise<void> {
  const configs = getRequiredDocumentConfigs(service);
  if (configs.length === 0) return;

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: {
      id: true,
      currentAssignedUserId: true,
      createdById: true,
    },
  });

  const currentDocuments = await prisma.protocolDocument.findMany({
    where: { protocolId },
    orderBy: { createdAt: 'asc' },
  });

  for (const config of configs) {
    const docName = String(config.name || 'Documento');

    const exists = currentDocuments.find((document) =>
      matchDocumentType(document.documentType, docName),
    );
    if (exists) continue;

    const matchingUpload = uploadedDocs.find((document) =>
      matchDocumentType(document.documentType || document.fileName || '', docName),
    );

    if (matchingUpload && matchingUpload.fileUrl) {
      const created = await prisma.protocolDocument.create({
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
      currentDocuments.push(created);
    } else {
      const created = await prisma.protocolDocument.create({
        data: {
          protocolId,
          documentType: docName,
          isRequired: config.required ?? true,
          status: DocumentStatus.PENDING,
        },
      });
      currentDocuments.push(created);
    }
  }

  const pendingOwner = protocol?.currentAssignedUserId || protocol?.createdById || 'system';

  for (const document of currentDocuments) {
    if (!document.isRequired) continue;
    if (document.fileUrl) continue;
    if (document.status !== DocumentStatus.PENDING) continue;

    await pendingService.createDocumentPending(
      protocolId,
      document.documentType,
      pendingOwner,
      undefined,
      {
        documentId: document.id,
        sourceType: 'REQUIRED_DOCUMENT',
      },
    );
  }
}
