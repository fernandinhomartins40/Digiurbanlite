import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { syncProtocolRequiredDocuments } from './required-protocol-documents.service';

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

  return prisma.protocolDocument.findMany({
    where: { protocolId },
    orderBy: [
      { isRequired: 'desc' },
      { createdAt: 'asc' },
    ]
  });
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

      const relatedPendings = await prisma.protocolPending.findMany({
        where: {
          protocolId: currentDoc.protocolId,
          type: 'DOCUMENT',
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          metadata: {
            path: ['documentType'],
            equals: currentDoc.documentType
          }
        }
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

  const required = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true
        }
        });

  const uploaded = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true,
      status: {
        in: [DocumentStatus.UPLOADED, DocumentStatus.UNDER_REVIEW, DocumentStatus.APPROVED]
        }
        }
        });

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

  const required = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true
        }
        });

  const approved = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true,
      status: DocumentStatus.APPROVED
        }
        });

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
