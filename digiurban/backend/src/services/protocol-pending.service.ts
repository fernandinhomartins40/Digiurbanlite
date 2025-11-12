import { PendingType, PendingStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreatePendingData {
  protocolId: string;
  type: PendingType;
  title: string;
  description: string;
  dueDate?: Date;
  blocksProgress?: boolean;
  metadata?: any;
  createdBy: string;
}

export interface UpdatePendingData {
  status?: PendingStatus;
  resolution?: string;
  resolvedBy?: string;
  dueDate?: Date;
}

/**
 * Cria uma nova pendência em um protocolo
 */
export async function createPending(data: CreatePendingData) {
  return prisma.protocolPending.create({
    data: {
      protocolId: data.protocolId,
      type: data.type,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      blocksProgress: data.blocksProgress ?? true,
      metadata: data.metadata,
      createdBy: data.createdBy,
      status: PendingStatus.OPEN
        },
    include: {
      protocol: {
        select: {
          id: true,
          number: true,
          status: true
        }
      }
        }
        });
}

/**
 * Lista todas as pendências de um protocolo
 */
export async function getProtocolPendings(
  protocolId: string,
  status?: PendingStatus
) {
  return prisma.protocolPending.findMany({
    where: {
      protocolId,
      ...(status ? { status } : {})
        },
    orderBy: [
      { blocksProgress: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ]
        });
}

/**
 * Obtém uma pendência específica
 */
export async function getPendingById(pendingId: string) {
  return prisma.protocolPending.findUnique({
    where: { id: pendingId },
    include: {
      protocol: true
        }
      });
}

/**
 * Atualiza uma pendência
 */
export async function updatePending(
  pendingId: string,
  data: UpdatePendingData
) {
  return prisma.protocolPending.update({
    where: { id: pendingId },
    data
        });
}

/**
 * Marca pendência como em progresso
 */
export async function startPending(pendingId: string) {
  return prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.IN_PROGRESS
        }
        });
}

/**
 * Resolve uma pendência
 */
export async function resolvePending(
  pendingId: string,
  resolvedBy: string,
  resolution: string
) {
  return prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.RESOLVED,
      resolvedBy,
      resolvedAt: new Date(),
      resolution
        }
        });
}

/**
 * Cancela uma pendência
 */
export async function cancelPending(
  pendingId: string,
  resolvedBy: string,
  reason: string
) {
  return prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.CANCELLED,
      resolvedBy,
      resolvedAt: new Date(),
      resolution: `Cancelado: ${reason}`
        }
        });
}

/**
 * Verifica se há pendências bloqueantes abertas
 */
export async function hasBlockingPendings(protocolId: string) {
  const count = await prisma.protocolPending.count({
    where: {
      protocolId,
      blocksProgress: true,
      status: {
        in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS]
        }
        }
        });

  return count > 0;
}

/**
 * Conta pendências por status
 */
export async function countPendingsByStatus(protocolId: string) {
  const pendings = await prisma.protocolPending.groupBy({
    by: ['status'],
    where: { protocolId },
    _count: true
        });

  return pendings.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Verifica pendências expiradas e marca como tal
 */
export async function checkExpiredPendings(protocolId: string) {
  const now = new Date();

  const expired = await prisma.protocolPending.findMany({
    where: {
      protocolId,
      status: {
        in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS]
        },
      dueDate: {
        lt: now
        }
        }
        });

  // Marcar como expiradas
  await prisma.protocolPending.updateMany({
    where: {
      id: {
        in: expired.map((p) => p.id)
        }
        },
    data: {
      status: PendingStatus.EXPIRED
        }
        });

  return expired;
}

/**
 * Deleta uma pendência
 */
export async function deletePending(pendingId: string) {
  return prisma.protocolPending.delete({
    where: { id: pendingId }
        });
}

/**
 * Cria pendência de documento faltante
 */
export async function createDocumentPending(
  protocolId: string,
  documentType: string,
  createdBy: string,
  dueDate?: Date
) {
  return createPending({
    protocolId,
    type: PendingType.DOCUMENT,
    title: `Documento pendente: ${documentType}`,
    description: `É necessário enviar o documento: ${documentType}`,
    createdBy,
    dueDate,
    blocksProgress: true,
    metadata: { documentType }
        });
}

/**
 * Cria pendência de informação faltante
 */
export async function createInformationPending(
  protocolId: string,
  title: string,
  description: string,
  createdBy: string,
  dueDate?: Date
) {
  return createPending({
    protocolId,
    type: PendingType.INFORMATION,
    title,
    description,
    createdBy,
    dueDate,
    blocksProgress: true
        });
}

/**
 * Cria pendência de correção
 */
export async function createCorrectionPending(
  protocolId: string,
  title: string,
  description: string,
  createdBy: string,
  dueDate?: Date
) {
  return createPending({
    protocolId,
    type: PendingType.CORRECTION,
    title,
    description,
    createdBy,
    dueDate,
    blocksProgress: true
        });
}
