/**
 * Serviço de controle de assinaturas digitais em processos internos
 * Integra com o sistema de certificados do backend principal via API
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';

// ============================================================================
// LISTAR ASSINATURAS
// ============================================================================

export async function listSignatures(processId: string) {
  return prisma.processSignature.findMany({
    where: { processId },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// SOLICITAR ASSINATURA
// ============================================================================

export async function requestSignature(data: {
  processId: string;
  documentId?: string;
  requestedById: string;
  requestedByName: string;
  signerId?: string;
  signerName?: string;
  signerEmail?: string;
  expiresInHours?: number;
}) {
  const process = await prisma.internalProcess.findUnique({
    where: { id: data.processId },
    select: { id: true, status: true, number: true },
  });

  if (!process) throw new Error('Processo não encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO' || process.status === 'ARQUIVADO') {
    throw new Error('Não é possível solicitar assinatura para um processo finalizado');
  }

  let expiresAt: Date | undefined;
  if (data.expiresInHours) {
    expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expiresInHours);
  }

  const signature = await prisma.processSignature.create({
    data: {
      processId: data.processId,
      documentId: data.documentId,
      requestedById: data.requestedById,
      requestedByName: data.requestedByName,
      signerId: data.signerId,
      signerName: data.signerName,
      signerEmail: data.signerEmail,
      status: 'PENDENTE',
      expiresAt,
    },
  });

  logger.info(`Assinatura solicitada no processo ${process.number}`, {
    signatureId: signature.id,
    signerId: data.signerId,
  });

  return signature;
}

// ============================================================================
// CONFIRMAR ASSINATURA (marcar como assinado)
// ============================================================================

export async function confirmSignature(signatureId: string, userId: string, signatureHash?: string) {
  const signature = await prisma.processSignature.findUnique({
    where: { id: signatureId },
    include: { process: { select: { number: true } } },
  });

  if (!signature) throw new Error('Solicitação de assinatura não encontrada');
  if (signature.status !== 'PENDENTE') throw new Error('Esta assinatura já foi processada');
  if (signature.signerId && signature.signerId !== userId) {
    throw new Error('Esta assinatura deve ser realizada por outro usuário');
  }

  // Verificar expiração
  if (signature.expiresAt && signature.expiresAt < new Date()) {
    await prisma.processSignature.update({
      where: { id: signatureId },
      data: { status: 'EXPIRADO' },
    });
    throw new Error('O prazo para assinatura expirou');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const sig = await tx.processSignature.update({
      where: { id: signatureId },
      data: {
        status: 'ASSINADO',
        signedAt: new Date(),
        signerId: userId,
        signatureHash,
      },
    });

    // Se havia documentId, marcar o documento como assinado
    if (signature.documentId) {
      await tx.processDocument.update({
        where: { id: signature.documentId },
        data: { isSigned: true, signedAt: new Date(), signedById: userId },
      });
    }

    // Registrar no histórico
    await tx.internalProcessHistory.create({
      data: {
        processId: signature.processId,
        action: 'ASSINATURA',
        description: `Documento assinado digitalmente`,
        userId,
        userName: signature.signerName || 'Servidor',
      },
    });

    return sig;
  });

  logger.info(`Assinatura confirmada no processo ${signature.process.number}`);
  return updated;
}

// ============================================================================
// REJEITAR ASSINATURA
// ============================================================================

export async function rejectSignature(signatureId: string, userId: string, reason: string) {
  const signature = await prisma.processSignature.findUnique({
    where: { id: signatureId },
  });

  if (!signature) throw new Error('Solicitação de assinatura não encontrada');
  if (signature.status !== 'PENDENTE') throw new Error('Esta assinatura já foi processada');

  return prisma.processSignature.update({
    where: { id: signatureId },
    data: {
      status: 'REJEITADO',
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  });
}

// ============================================================================
// MARCAR DESPACHO COMO LIDO
// ============================================================================

export async function markDispatchRead(dispatchId: string) {
  return prisma.processDispatch.update({
    where: { id: dispatchId },
    data: { isRead: true, readAt: new Date() },
  });
}

// ============================================================================
// MARCAR TODOS OS DESPACHOS DO SETOR COMO LIDOS
// ============================================================================

export async function markAllDispatchesRead(sectorId: string) {
  return prisma.processDispatch.updateMany({
    where: { toSectorId: sectorId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
