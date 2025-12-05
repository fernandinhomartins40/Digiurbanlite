import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

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
 * COM RETROCOMPATIBILIDADE: lê de protocol_documents OU do campo attachments antigo
 */
export async function getProtocolDocuments(protocolId: string) {
  // Buscar documentos da nova tabela
  const documentsFromTable = await prisma.protocolDocument.findMany({
    where: { protocolId },
    orderBy: [
      { isRequired: 'desc' },
      { createdAt: 'asc' },
    ]
  });

  // Se encontrou documentos na tabela, retornar
  if (documentsFromTable.length > 0) {
    return documentsFromTable;
  }

  // RETROCOMPATIBILIDADE: Se não encontrou, buscar do campo attachments antigo
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: {
      attachments: true,
      documents: true
    }
  });

  if (!protocol) {
    return [];
  }

  // Tentar parsear attachments (pode ser string JSON ou array)
  let attachments: any[] = [];

  if (protocol.attachments) {
    try {
      if (typeof protocol.attachments === 'string') {
        attachments = JSON.parse(protocol.attachments);
      } else if (Array.isArray(protocol.attachments)) {
        attachments = protocol.attachments;
      }
    } catch (e) {
      console.warn('Erro ao parsear attachments:', e);
    }
  }

  // Tentar parsear documents (campo antigo alternativo)
  if (attachments.length === 0 && protocol.documents) {
    try {
      if (typeof protocol.documents === 'string') {
        attachments = JSON.parse(protocol.documents);
      } else if (Array.isArray(protocol.documents)) {
        attachments = protocol.documents;
      }
    } catch (e) {
      console.warn('Erro ao parsear documents:', e);
    }
  }

  // Converter attachments antigos para formato de ProtocolDocument
  return attachments.map((att: any, index: number) => ({
    id: `legacy_${index}`,
    protocolId,
    documentType: att.documentId || att.id || 'Documento',
    isRequired: false,
    status: DocumentStatus.UPLOADED,
    fileName: att.originalName || att.filename || att.name || 'arquivo',
    fileUrl: att.path || att.url,
    fileSize: att.size || 0,
    mimeType: att.mimetype || 'application/octet-stream',
    uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
    uploadedBy: null,
    validatedAt: null,
    validatedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    version: 1,
    previousDocId: null,
    createdAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
    updatedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date()
  }));
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
 */
export async function uploadDocument(
  documentId: string,
  fileData: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  }
) {
  // Buscar o documento atual para criar versão
  const currentDoc = await prisma.protocolDocument.findUnique({
    where: { id: documentId }
        });

  if (!currentDoc) {
    throw new Error('Documento não encontrado');
  }

  // Se já existe um arquivo, criar nova versão
  if (currentDoc.fileUrl) {
    const newVersion = currentDoc.version + 1;

    return prisma.protocolDocument.update({
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
  }

  // Primeiro upload
  return prisma.protocolDocument.update({
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

  // Verificar se todos documentos obrigatórios foram aprovados
  const check = await checkAllDocumentsApproved(document.protocolId);

  if (check.allApproved) {
    // Todos aprovados! Atualizar protocolo para PROGRESSO
    await prisma.protocolSimplified.update({
      where: { id: document.protocolId },
      data: {
        status: 'PROGRESSO'
      }
    });

    // Criar notificação para cidadão
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: document.protocolId },
      select: { citizenId: true, number: true }
    });

    if (protocol) {
      await prisma.notification.create({
        data: {
          citizenId: protocol.citizenId,
          title: 'Documentos Aprovados',
          message: `Todos os documentos do protocolo ${protocol.number} foram aprovados! Seu processo está em andamento.`,
          type: 'SUCCESS',
          protocolId: document.protocolId
        }
      }).catch(err => console.error('Erro ao criar notificação:', err));
    }
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

  // Atualizar protocolo para PENDENCIA
  await prisma.protocolSimplified.update({
    where: { id: document.protocolId },
    data: {
      status: 'PENDENCIA'
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

  // Criar notificação para cidadão
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: document.protocolId },
    select: { citizenId: true, number: true }
  });

  if (protocol) {
    await prisma.notification.create({
      data: {
        citizenId: protocol.citizenId,
        title: 'Documento Rejeitado',
        message: `O documento "${document.documentType}" do protocolo ${protocol.number} foi rejeitado. Motivo: ${rejectionReason}. Por favor, envie um novo documento.`,
        type: 'WARNING',
        protocolId: document.protocolId
      }
    }).catch(err => console.error('Erro ao criar notificação:', err));
  }

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
