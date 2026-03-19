import { prisma } from '../lib/prisma';

interface PublishGeneratedDocumentInput {
  documentId: string;
  publishedBy: string;
}

interface MarkGeneratedDocumentAsSentInput {
  documentId: string;
  sentBy: string;
  sentTo: string;
}

function buildCitizenDocumentType(document: {
  template: {
    documentType?: string | null;
    name: string;
  };
}) {
  return `Protocolo: ${document.template.documentType || document.template.name}`;
}

export async function publishGeneratedDocument(input: PublishGeneratedDocumentInput) {
  const { documentId, publishedBy } = input;

  const document = await prisma.generatedDocument.findUnique({
    where: { id: documentId },
    include: {
      protocol: {
        select: {
          citizenId: true,
          number: true,
        },
      },
      template: {
        select: {
          name: true,
          documentType: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error('Documento gerado não encontrado');
  }

  if (!document.isActive || document.deletedAt) {
    throw new Error('Documento gerado está inativo');
  }

  if (document.status === 'SUPERSEDED') {
    throw new Error('Documento gerado foi substituído por uma revisão mais recente');
  }

  if (document.status === 'PUBLISHED' && document.publishedToCitizen) {
    return document;
  }

  if (!document.isSigned || document.status !== 'SIGNED') {
    throw new Error('Somente documentos assinados podem ser disponibilizados ao cidadão');
  }

  const now = new Date();

  return prisma.$transaction(async tx => {
    const updatedDocument = await tx.generatedDocument.update({
      where: { id: documentId },
      data: {
        status: 'PUBLISHED',
        publishedToCitizen: true,
        publishedAt: now,
        publishedBy,
      },
    });

    const previousSourceIds = [
      documentId,
      ...(document.previousVersionId ? [document.previousVersionId] : []),
    ];

    const existingCitizenDocument = await tx.citizenDocument.findFirst({
      where: {
        citizenId: document.protocol.citizenId,
        sourceDocumentId: {
          in: previousSourceIds,
        },
      },
    });

    const citizenDocumentPayload = {
      citizenId: document.protocol.citizenId,
      documentType: buildCitizenDocumentType(document),
      fileName: document.fileName,
      filePath: document.filePath,
      fileUrl: document.fileUrl || undefined,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      status: 'APPROVED' as const,
      sourceType: 'PROTOCOL',
      sourceDocumentId: document.id,
      notes: `Documento publicado a partir do protocolo ${document.protocol.number}`,
      isVerified: true,
      verifiedAt: now,
      verifiedBy: publishedBy,
      reviewedBy: publishedBy,
      reviewedAt: now,
    };

    if (existingCitizenDocument) {
      await tx.citizenDocument.update({
        where: { id: existingCitizenDocument.id },
        data: citizenDocumentPayload,
      });
    } else {
      await tx.citizenDocument.create({
        data: citizenDocumentPayload,
      });
    }

    return updatedDocument;
  });
}

export async function markGeneratedDocumentAsSent(input: MarkGeneratedDocumentAsSentInput) {
  const { documentId, sentBy, sentTo } = input;

  return prisma.generatedDocument.update({
    where: { id: documentId },
    data: {
      wasSent: true,
      sentAt: new Date(),
      sentBy,
      sentTo,
    },
  });
}

export async function supersedeGeneratedDocument(documentId: string) {
  return prisma.generatedDocument.update({
    where: { id: documentId },
    data: {
      status: 'SUPERSEDED',
      publishedToCitizen: false,
      supersededAt: new Date(),
    },
  });
}
