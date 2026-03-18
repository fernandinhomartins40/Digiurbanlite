import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { syncProtocolRequiredDocuments } from './required-protocol-documents.service';
import { matchDocumentType, resolveCanonicalDocumentType } from '../utils/document-mapping';
import { normalizeDocumentConfigs } from '../utils/document-validation';

export interface CreateDocumentData {
  protocolId: string;
  documentType: string;
  isRequired: boolean;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
}

export interface UpdateDocumentData {
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  status?: DocumentStatus;
  uploadedBy?: string;
  validatedBy?: string;
  rejectionReason?: string;
}

function getDocumentStatusRank(status: DocumentStatus) {
  switch (status) {
    case DocumentStatus.APPROVED:
      return 5;
    case DocumentStatus.UNDER_REVIEW:
      return 4;
    case DocumentStatus.UPLOADED:
      return 3;
    case DocumentStatus.REJECTED:
      return 2;
    case DocumentStatus.PENDING:
      return 1;
    default:
      return 0;
  }
}

function parseRequiredDocumentNames(raw: unknown): string[] {
  if (!raw) return [];

  let docsRaw: any[] = [];
  if (typeof raw === 'string') {
    try {
      docsRaw = JSON.parse(raw);
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    docsRaw = raw;
  }

  return normalizeDocumentConfigs(docsRaw)
    .map((config) => String(config?.name || '').trim())
    .filter(Boolean);
}

async function getProtocolRequiredDocumentNames(protocolId: string): Promise<string[]> {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: {
      service: {
        select: {
          requiresDocuments: true,
          requiredDocuments: true,
        },
      },
      stages: {
        select: {
          metadata: true,
        },
      },
    },
  });

  const requiredNames = new Set<string>();

  if (protocol?.service?.requiresDocuments !== false) {
    for (const documentName of parseRequiredDocumentNames(protocol?.service?.requiredDocuments)) {
      requiredNames.add(documentName);
    }
  }

  for (const stage of protocol?.stages || []) {
    const metadata = stage.metadata as Record<string, unknown> | null;
    const requiredDocumentTypes = Array.isArray(metadata?.requiredDocumentTypes)
      ? metadata.requiredDocumentTypes
      : [];

    for (const requiredDocumentType of requiredDocumentTypes) {
      if (typeof requiredDocumentType !== 'string') continue;
      const trimmed = requiredDocumentType.trim();
      if (trimmed) {
        requiredNames.add(trimmed);
      }
    }
  }

  return Array.from(requiredNames);
}

function mergeListedDocumentEntries(existing: any, candidate: any) {
  const keepCandidate =
    (!existing.fileUrl && candidate.fileUrl) ||
    getDocumentStatusRank(candidate.status) > getDocumentStatusRank(existing.status) ||
    (
      getDocumentStatusRank(candidate.status) === getDocumentStatusRank(existing.status) &&
      new Date(candidate.updatedAt).getTime() > new Date(existing.updatedAt).getTime()
    );

  const base = keepCandidate ? candidate : existing;
  const other = keepCandidate ? existing : candidate;

  return {
    ...base,
    documentType: base.documentType,
    isRequired: Boolean(base.isRequired || other.isRequired),
  };
}

function normalizeProtocolDocumentList<T extends {
  id: string;
  documentType: string;
  fileName?: string | null;
  fileUrl?: string | null;
  isRequired?: boolean | null;
  status: DocumentStatus;
  updatedAt: Date;
  createdAt: Date;
}>(documents: T[], requiredNames: string[]): T[] {
  const grouped = new Map<string, T>();

  for (const document of documents) {
    const canonicalType =
      resolveCanonicalDocumentType(String(document.documentType || ''), requiredNames) ||
      resolveCanonicalDocumentType(String(document.fileName || ''), requiredNames);

    const normalizedDocument = {
      ...document,
      documentType: canonicalType || document.documentType,
      isRequired: canonicalType ? true : document.isRequired,
    } as T;

    const key = canonicalType ? `required:${canonicalType}` : `raw:${document.id}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, normalizedDocument);
      continue;
    }

    grouped.set(key, mergeListedDocumentEntries(existing, normalizedDocument));
  }

  return Array.from(grouped.values()).sort((left, right) => {
    if (Boolean(left.isRequired) !== Boolean(right.isRequired)) {
      return Number(Boolean(right.isRequired)) - Number(Boolean(left.isRequired));
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

async function getNormalizedProtocolDocuments(protocolId: string) {
  const requiredNames = await getProtocolRequiredDocumentNames(protocolId);

  const documents = await prisma.protocolDocument.findMany({
    where: { protocolId },
    orderBy: [
      { isRequired: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  return normalizeProtocolDocumentList(documents, requiredNames);
}

async function getRequiredDocumentProgress(protocolId: string) {
  const requiredNames = await getProtocolRequiredDocumentNames(protocolId);
  if (requiredNames.length === 0) {
    return {
      requiredNames: [],
      uploadedNames: [] as string[],
      approvedNames: [] as string[],
    };
  }

  const documents = await getNormalizedProtocolDocuments(protocolId);
  const uploadedNames: string[] = [];
  const approvedNames: string[] = [];

  for (const requiredName of requiredNames) {
    const matchingDocuments = documents.filter((document) =>
      matchDocumentType(document.documentType || document.fileName || '', requiredName)
    );

    if (matchingDocuments.some((document) =>
      document.status === DocumentStatus.UPLOADED ||
      document.status === DocumentStatus.UNDER_REVIEW ||
      document.status === DocumentStatus.APPROVED
    )) {
      uploadedNames.push(requiredName);
    }

    if (matchingDocuments.some((document) => document.status === DocumentStatus.APPROVED)) {
      approvedNames.push(requiredName);
    }
  }

  return {
    requiredNames,
    uploadedNames,
    approvedNames,
  };
}

/**
 * Cria um novo documento no protocolo
 */
export async function createProtocolDocument(data: CreateDocumentData) {
  return prisma.protocolDocument.create({
    data: {
      protocolId: data.protocolId,
      documentType: data.documentType,
      isRequired: data.isRequired,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy,
      status: data.fileUrl ? DocumentStatus.UPLOADED : DocumentStatus.PENDING,
      uploadedAt: data.fileUrl ? new Date() : undefined
        },
    include: {
      protocol: {
        select: {
          id: true,
          number: true
        }
      }
        }
        });
}

/**
 * Lista todos os documentos de um protocolo
 */
export async function getProtocolDocuments(protocolId: string) {
  try {
    await syncProtocolRequiredDocuments(protocolId);
  } catch (error) {
    console.error('[protocol-document.service] Failed to sync required documents before listing:', error);
  }

  return getNormalizedProtocolDocuments(protocolId);
}

/**
 * Obtém um documento específico
 */
export async function getDocumentById(documentId: string) {
  return prisma.protocolDocument.findUnique({
    where: { id: documentId },
    include: {
      protocol: true
        }
      });
}

/**
 * Faz upload de um documento (atualiza com arquivo)
 * ✅ FASE 1: Resolve automaticamente pendências relacionadas ao reenviar documento
 */
export async function uploadDocument(
  documentId: string,
  fileData: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  },
  options: {
    skipPendingSubmission?: boolean;
  } = {}
) {
  // Buscar o documento atual para criar versão
  const currentDoc = await prisma.protocolDocument.findUnique({
    where: { id: documentId }
        });

  if (!currentDoc) {
    throw new Error('Documento não encontrado');
  }

  let updatedDocument;

  // Se já existe um arquivo, criar nova versão
  if (currentDoc.fileUrl) {
    const newVersion = currentDoc.version + 1;

    updatedDocument = await prisma.protocolDocument.update({
      where: { id: documentId },
      data: {
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        uploadedBy: fileData.uploadedBy,
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED,
        version: newVersion,
        previousDocId: documentId, // Referência à versão anterior
      }
        });
  } else {
    // Primeiro upload
    updatedDocument = await prisma.protocolDocument.update({
      where: { id: documentId },
      data: {
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        uploadedBy: fileData.uploadedBy,
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED
        }
        });
  }

  // Quando o cidadão reenviar um documento, a pendência deve ficar em revisão.
  if (!options.skipPendingSubmission) {
    try {
      const pendingService = await import('./protocol-pending.service');

      const candidatePendings = await prisma.protocolPending.findMany({
        where: {
          protocolId: currentDoc.protocolId,
          type: 'DOCUMENT',
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        }
      });

      const relatedPendings = candidatePendings.filter((pending) => {
        const metadata = pending.metadata as Record<string, unknown> | null;
        return matchDocumentType(currentDoc.documentType, String(metadata?.documentType || ''));
      });

      if (relatedPendings.length > 0) {
        console.log(`📄 Documento "${currentDoc.documentType}" reenviado - Movendo ${relatedPendings.length} pendência(s) para revisão`);

        for (const pending of relatedPendings) {
          await pendingService.submitPendingResponse(
            pending.id,
            fileData.uploadedBy,
            `Documento reenviado pelo cidadão (versão ${updatedDocument.version})`,
            {
              documentId: updatedDocument.id,
              lastSubmittedDocumentId: updatedDocument.id,
              lastSubmittedFileName: updatedDocument.fileName,
            }
          );

          console.log(`✅ Pendência "${pending.title}" enviada para reanálise`);
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao atualizar pendências do documento reenviado:', error);
    }
  }

  return updatedDocument;
}

/**
 * Aprova um documento e verifica se todos estão aprovados
 */
export async function approveDocument(
  documentId: string,
  validatedBy: string
) {
  // Buscar documento para obter protocolId
  const document = await prisma.protocolDocument.findUnique({
    where: { id: documentId },
    select: { protocolId: true, documentType: true }
  });

  if (!document) {
    throw new Error('Documento não encontrado');
  }

  // Atualizar documento
  const updatedDocument = await prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.APPROVED,
      validatedBy,
      validatedAt: new Date(),
      rejectionReason: null
        }
        });

  // Criar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId: document.protocolId,
      action: 'DOCUMENTO_APROVADO',
      comment: `Documento "${document.documentType}" aprovado`,
      userId: validatedBy
    }
  }).catch(err => console.error('Erro ao criar histórico:', err));

  // ✨ NOVO: Disparar orquestrador de workflow
  const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
  await workflowOrchestrator.onDocumentApproved(documentId, validatedBy);

  return updatedDocument;
}

/**
 * Rejeita um documento e atualiza status do protocolo
 */
export async function rejectDocument(
  documentId: string,
  validatedBy: string,
  rejectionReason: string
) {
  // Buscar documento para obter protocolId
  const document = await prisma.protocolDocument.findUnique({
    where: { id: documentId },
    select: { protocolId: true, documentType: true }
  });

  if (!document) {
    throw new Error('Documento não encontrado');
  }

  // Atualizar documento
  const updatedDocument = await prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.REJECTED,
      validatedBy,
      rejectedAt: new Date(),
      rejectionReason
        }
        });

  // Criar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId: document.protocolId,
      action: 'DOCUMENTO_REJEITADO',
      comment: `Documento "${document.documentType}" rejeitado. Motivo: ${rejectionReason}`,
      userId: validatedBy
    }
  }).catch(err => console.error('Erro ao criar histórico:', err));

  // ✨ NOVO: Disparar orquestrador de workflow
  const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
  await workflowOrchestrator.onDocumentRejected(documentId, validatedBy, rejectionReason);

  return updatedDocument;
}

/**
 * Marca documento como em análise
 */
export async function markDocumentUnderReview(documentId: string) {
  return prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.UNDER_REVIEW
        }
        });
}

/**
 * Verifica se todos os documentos obrigatórios foram enviados
 */
export async function checkRequiredDocuments(protocolId: string) {
  await syncProtocolRequiredDocuments(protocolId);
  const progress = await getRequiredDocumentProgress(protocolId);
  const required = progress.requiredNames.length;
  const uploaded = progress.uploadedNames.length;

  return {
    total: required,
    uploaded,
    pending: required - uploaded,
    allUploaded: required === uploaded
        };
}

/**
 * Verifica se todos os documentos foram aprovados
 */
export async function checkAllDocumentsApproved(protocolId: string) {
  await syncProtocolRequiredDocuments(protocolId);
  const progress = await getRequiredDocumentProgress(protocolId);
  const required = progress.requiredNames.length;
  const approved = progress.approvedNames.length;

  return {
    total: required,
    approved,
    pending: required - approved,
    allApproved: required === approved
        };
}

/**
 * Deleta um documento
 */
export async function deleteDocument(documentId: string) {
  return prisma.protocolDocument.delete({
    where: { id: documentId }
        });
}

/**
 * Solicita um novo documento ao cidadão
 */
export async function requestDocument(
  protocolId: string,
  documentType: string,
  isRequired: boolean = true
) {
  return createProtocolDocument({
    protocolId,
    documentType,
    isRequired
        });
}
