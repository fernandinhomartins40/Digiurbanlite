import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { syncProtocolRequiredDocuments } from './required-protocol-documents.service';
import { matchDocumentType, resolveCanonicalDocumentType } from '../utils/document-mapping';
import { normalizeDocumentConfigs } from '../utils/document-validation';

/** Erro de regra (documento não enviado, versão inexistente...): vira 4xx */
export class DocumentActionError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 409) {
    super(message);
    this.name = 'DocumentActionError';
    this.statusCode = statusCode;
  }
}

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

function getPendingRequestedDocumentTypes(metadata: unknown): string[] {
  const source =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : null;

  if (!source) return [];

  const requestedTypes = new Set<string>();

  const pushValue = (value: unknown) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (trimmed) {
      requestedTypes.add(trimmed);
    }
  };

  pushValue(source.documentType);

  if (Array.isArray(source.documentTypes)) {
    for (const documentType of source.documentTypes) {
      pushValue(documentType);
    }
  }

  if (Array.isArray(source.documentRequests)) {
    for (const item of source.documentRequests) {
      if (!item || typeof item !== 'object') continue;
      const documentRequest = item as Record<string, unknown>;
      pushValue(documentRequest.documentType);
      pushValue(documentRequest.label);
      pushValue(documentRequest.documentId);
    }
  }

  return Array.from(requestedTypes);
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

  // Se já existe um arquivo, guardar o envio atual no histórico e gravar o novo.
  // Antes o reenvio sobrescrevia o arquivo recusado (sumia o histórico) e o
  // registro passava a apontar para si mesmo como "versão anterior".
  if (currentDoc.fileUrl) {
    await archiveCurrentVersion(currentDoc);

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
        version: currentDoc.version + 1,
        previousDocId: null,
        validatedAt: null,
        validatedBy: null,
        rejectedAt: null,
        rejectionReason: null,
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
        const requestedTypes = getPendingRequestedDocumentTypes(pending.metadata);
        return requestedTypes.some((requestedType) =>
          matchDocumentType(currentDoc.documentType, requestedType)
        );
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
  validatedBy: string,
  options: { skipWorkflow?: boolean } = {}
) {
  // Buscar documento para obter protocolId
  const document = await prisma.protocolDocument.findUnique({
    where: { id: documentId },
    select: { protocolId: true, documentType: true, fileUrl: true, status: true }
  });

  if (!document) {
    throw new DocumentActionError('Documento não encontrado', 404);
  }

  if (!document.fileUrl) {
    throw new DocumentActionError('O cidadão ainda não enviou este documento.');
  }

  // Aprovar de novo não repete histórico, avisos nem avanço do fluxo
  if (document.status === DocumentStatus.APPROVED) {
    return prisma.protocolDocument.findUnique({ where: { id: documentId } });
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

  if (options.skipWorkflow) {
    return updatedDocument;
  }

  // ✨ NOVO: Disparar orquestrador de workflow
  try {
    const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
    await workflowOrchestrator.onDocumentApproved(documentId, validatedBy);
  } catch (error) {
    console.error('[protocol-document.service] Falha ao processar side effects da aprovacao do documento:', {
      documentId,
      protocolId: document.protocolId,
      documentType: document.documentType,
      error: error instanceof Error ? error.message : String(error),
    });
  }

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
    select: { protocolId: true, documentType: true, fileUrl: true, status: true }
  });

  if (!document) {
    throw new DocumentActionError('Documento não encontrado', 404);
  }

  if (!document.fileUrl) {
    throw new DocumentActionError('O cidadão ainda não enviou este documento.');
  }

  if (document.status === DocumentStatus.REJECTED) {
    throw new DocumentActionError('Este documento já foi recusado e aguarda novo envio do cidadão.');
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
  try {
    const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
    await workflowOrchestrator.onDocumentRejected(documentId, validatedBy, rejectionReason);
  } catch (error) {
    console.error('[protocol-document.service] Falha ao processar side effects da rejeicao do documento:', {
      documentId,
      protocolId: document.protocolId,
      documentType: document.documentType,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return updatedDocument;
}

/**
 * Guarda o envio atual no histórico antes de ser substituído
 */
async function archiveCurrentVersion(document: {
  id: string;
  tenantId: string | null;
  protocolId: string;
  version: number;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  status: DocumentStatus;
  uploadedAt: Date | null;
  uploadedBy: string | null;
  validatedAt: Date | null;
  validatedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
}) {
  await prisma.protocolDocumentVersion.create({
    data: {
      tenantId: document.tenantId,
      documentId: document.id,
      protocolId: document.protocolId,
      version: document.version,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      status: document.status,
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
      validatedAt: document.validatedAt,
      validatedBy: document.validatedBy,
      rejectedAt: document.rejectedAt,
      rejectionReason: document.rejectionReason,
    },
  });
}

/**
 * Todas as versões de um documento: as guardadas + a atual (mais antiga primeiro)
 */
export async function getDocumentVersions(documentId: string) {
  const current = await prisma.protocolDocument.findUnique({ where: { id: documentId } });
  if (!current) return null;

  const archived = await prisma.protocolDocumentVersion.findMany({
    where: { documentId },
    orderBy: [{ version: 'asc' }, { archivedAt: 'asc' }],
  });

  return {
    current,
    versions: [
      ...archived.map((version) => ({ ...version, isCurrent: false })),
      { ...current, documentId: current.id, isCurrent: true },
    ],
  };
}

/**
 * Arquivo de uma versão: o id pode ser de uma versão guardada ou do próprio documento
 */
export async function getDocumentVersionFile(documentId: string, versionId: string) {
  if (versionId === documentId) {
    return prisma.protocolDocument.findUnique({ where: { id: documentId } });
  }
  return prisma.protocolDocumentVersion.findFirst({ where: { id: versionId, documentId } });
}

/**
 * Volta um arquivo antigo como envio atual (o atual vai para o histórico)
 */
export async function restoreDocumentVersion(documentId: string, versionId: string, restoredBy: string) {
  const current = await prisma.protocolDocument.findUnique({ where: { id: documentId } });
  if (!current) {
    throw new DocumentActionError('Documento não encontrado', 404);
  }

  const old = await prisma.protocolDocumentVersion.findFirst({ where: { id: versionId, documentId } });
  if (!old) {
    throw new DocumentActionError('Versão não encontrada', 404);
  }

  if (current.fileUrl) {
    await archiveCurrentVersion(current);
  }

  const restored = await prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      fileName: old.fileName,
      fileUrl: old.fileUrl,
      fileSize: old.fileSize,
      mimeType: old.mimeType,
      version: current.version + 1,
      previousDocId: null,
      uploadedAt: new Date(),
      uploadedBy: restoredBy,
      status: DocumentStatus.UPLOADED,
      validatedAt: null,
      validatedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId: current.protocolId,
      action: 'DOCUMENTO_RESTAURADO',
      comment: `Documento "${current.documentType}" restaurado para a versão ${old.version}`,
      userId: restoredBy,
    },
  }).catch((error) => console.error('[protocol-document.service] Falha ao registrar histórico:', error));

  return { restored, restoredFromVersion: old.version };
}

/**
 * Marca documento como em análise
 */
export async function markDocumentUnderReview(documentId: string) {
  const document = await prisma.protocolDocument.findUnique({
    where: { id: documentId },
    select: { fileUrl: true, status: true },
  });

  if (!document) {
    throw new DocumentActionError('Documento não encontrado', 404);
  }

  if (!document.fileUrl || document.status !== DocumentStatus.UPLOADED) {
    throw new DocumentActionError('Só dá para colocar em análise um documento enviado e ainda não analisado.');
  }

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
