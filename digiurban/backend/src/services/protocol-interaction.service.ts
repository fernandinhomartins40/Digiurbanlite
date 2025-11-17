import { InteractionType } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreateInteractionData {
  protocolId: string;
  type: InteractionType;
  authorType: 'CITIZEN' | 'SERVER' | 'SYSTEM';
  authorId?: string;
  authorName: string;
  message?: string;
  metadata?: any;
  isInternal?: boolean;
  attachments?: any;
}

export interface UpdateInteractionData {
  isRead?: boolean;
  readAt?: Date;
}

/**
 * Cria uma nova interação em um protocolo
 */
export async function createInteraction(data: CreateInteractionData) {
  return prisma.protocolInteraction.create({
    data: {
      protocolId: data.protocolId,
      type: data.type,
      authorType: data.authorType,
      authorId: data.authorId,
      authorName: data.authorName,
      message: data.message,
      metadata: data.metadata,
      isInternal: data.isInternal || false,
      attachments: data.attachments
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
 * Lista todas as interações de um protocolo
 */
export async function getProtocolInteractions(
  protocolId: string,
  includeInternal: boolean = false
) {
  return prisma.protocolInteraction.findMany({
    where: {
      protocolId,
      ...(includeInternal ? {} : { isInternal: false })
        },
    orderBy: {
      createdAt: 'desc'
        }
        });
}

/**
 * Marca uma interação como lida
 */
export async function markInteractionAsRead(interactionId: string) {
  return prisma.protocolInteraction.update({
    where: { id: interactionId },
    data: {
      isRead: true,
      readAt: new Date()
        }
        });
}

/**
 * Marca todas as interações de um protocolo como lidas
 */
export async function markAllProtocolInteractionsAsRead(protocolId: string) {
  return prisma.protocolInteraction.updateMany({
    where: {
      protocolId,
      isRead: false
        },
    data: {
      isRead: true,
      readAt: new Date()
        }
        });
}

/**
 * Conta interações não lidas de um protocolo
 */
export async function countUnreadInteractions(protocolId: string) {
  return prisma.protocolInteraction.count({
    where: {
      protocolId,
      isRead: false,
      isInternal: false
        }
        });
}

/**
 * Deleta uma interação (apenas para correções)
 */
export async function deleteInteraction(interactionId: string) {
  return prisma.protocolInteraction.delete({
    where: { id: interactionId }
        });
}

/**
 * Cria interação automática de mudança de status
 */
export async function createStatusChangeInteraction(
  protocolId: string,
  oldStatus: string,
  newStatus: string,
  authorId: string,
  authorName: string
) {
  return createInteraction({
    protocolId,
    type: InteractionType.STATUS_CHANGED,
    authorType: 'SERVER',
    authorId,
    authorName,
    message: `Status alterado de ${oldStatus} para ${newStatus}`,
    metadata: { oldStatus, newStatus }
        });
}

/**
 * Cria interação automática de atribuição
 */
export async function createAssignmentInteraction(
  protocolId: string,
  assignedTo: string,
  assignedBy: string,
  assignedByName: string
) {
  return createInteraction({
    protocolId,
    type: InteractionType.ASSIGNED,
    authorType: 'SERVER',
    authorId: assignedBy,
    authorName: assignedByName,
    message: `Protocolo atribuído para ${assignedTo}`,
    metadata: { assignedTo }
        });
}
