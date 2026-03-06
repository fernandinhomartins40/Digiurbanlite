/**
 * Signature control service for internal processes.
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { FlowAuthContext } from '../middleware/auth.middleware';
import {
  assertOrganizationalUnitScope,
  assertProcessAccess,
} from './access-control.service';

export async function listSignatures(processId: string, auth: FlowAuthContext) {
  await assertProcessAccess(prisma, processId, auth);
  return prisma.processSignature.findMany({
    where: { processId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function requestSignature(
  data: {
    processId: string;
    documentId?: string;
    requestedById: string;
    requestedByName: string;
    signerId?: string;
    signerName?: string;
    signerEmail?: string;
    expiresInHours?: number;
  },
  auth: FlowAuthContext,
) {
  await assertProcessAccess(prisma, data.processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: data.processId },
    select: { id: true, status: true, number: true },
  });

  if (!process) throw new Error('Processo nao encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO' || process.status === 'ARQUIVADO') {
    throw new Error('Nao e possivel solicitar assinatura para um processo finalizado');
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

export async function confirmSignature(
  signatureId: string,
  userId: string,
  auth: FlowAuthContext,
  signatureHash?: string,
) {
  const signature = await prisma.processSignature.findUnique({
    where: { id: signatureId },
    include: { process: { select: { number: true, id: true } } },
  });

  if (!signature) throw new Error('Solicitacao de assinatura nao encontrada');
  await assertProcessAccess(prisma, signature.process.id, auth);
  if (signature.status !== 'PENDENTE') throw new Error('Esta assinatura ja foi processada');
  if (signature.signerId && signature.signerId !== userId) {
    throw new Error('Esta assinatura deve ser realizada por outro usuario');
  }

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

    if (signature.documentId) {
      await tx.processDocument.update({
        where: { id: signature.documentId },
        data: { isSigned: true, signedAt: new Date(), signedById: userId },
      });
    }

    await tx.internalProcessHistory.create({
      data: {
        processId: signature.processId,
        action: 'ASSINATURA',
        description: 'Documento assinado digitalmente',
        userId,
        userName: signature.signerName || 'Servidor',
      },
    });

    return sig;
  });

  logger.info(`Assinatura confirmada no processo ${signature.process.number}`);
  return updated;
}

export async function rejectSignature(
  signatureId: string,
  userId: string,
  auth: FlowAuthContext,
  reason: string,
) {
  const signature = await prisma.processSignature.findUnique({
    where: { id: signatureId },
    select: { id: true, status: true, processId: true, signerId: true },
  });

  if (!signature) throw new Error('Solicitacao de assinatura nao encontrada');
  await assertProcessAccess(prisma, signature.processId, auth);
  if (signature.status !== 'PENDENTE') throw new Error('Esta assinatura ja foi processada');
  if (signature.signerId && signature.signerId !== userId) {
    throw new Error('Esta assinatura deve ser rejeitada pelo assinante designado');
  }

  return prisma.processSignature.update({
    where: { id: signatureId },
    data: {
      status: 'REJEITADO',
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  });
}

export async function markDispatchRead(dispatchId: string, auth: FlowAuthContext) {
  const dispatch = await prisma.processDispatch.findUnique({
    where: { id: dispatchId },
    select: { id: true, processId: true, toOrganizationalUnitId: true },
  });

  if (!dispatch) throw new Error('Despacho nao encontrado');
  await assertProcessAccess(prisma, dispatch.processId, auth);
  assertOrganizationalUnitScope(auth, dispatch.toOrganizationalUnitId);

  return prisma.processDispatch.update({
    where: { id: dispatchId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllDispatchesRead(organizationalUnitId: string, auth: FlowAuthContext) {
  assertOrganizationalUnitScope(auth, organizationalUnitId);
  return prisma.processDispatch.updateMany({
    where: { toOrganizationalUnitId: organizationalUnitId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
