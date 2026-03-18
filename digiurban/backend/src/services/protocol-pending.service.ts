import { InteractionType, PendingStatus, PendingType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import messageNotificationService from '../lib/messages/MessageNotificationService';
import notificationService from './notification.service';
import * as interactionService from './protocol-interaction.service';

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

type PendingWithProtocol = Awaited<ReturnType<typeof prisma.protocolPending.findUnique>>;

const CITIZEN_ACTION_TYPES = new Set<PendingType>([
  PendingType.DOCUMENT,
  PendingType.INFORMATION,
  PendingType.CORRECTION,
  PendingType.VALIDATION,
  PendingType.PAYMENT,
]);

function getPendingMetadata(metadata: unknown): Record<string, any> {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? { ...(metadata as Record<string, any>) }
    : {};
}

export function isCitizenActionPending(
  pending: Pick<NonNullable<PendingWithProtocol>, 'type' | 'metadata'>
): boolean {
  const metadata = getPendingMetadata(pending.metadata);
  if (typeof metadata.requiresCitizenAction === 'boolean') {
    return metadata.requiresCitizenAction;
  }

  return CITIZEN_ACTION_TYPES.has(pending.type);
}

function inferPendingPriority(
  pending: Pick<NonNullable<PendingWithProtocol>, 'blocksProgress' | 'dueDate' | 'metadata'>
): number {
  const metadata = getPendingMetadata(pending.metadata);
  const explicitPriority = Number(metadata.priority);

  if (Number.isFinite(explicitPriority) && explicitPriority >= 1) {
    return Math.min(3, Math.max(1, Math.round(explicitPriority)));
  }

  if (pending.dueDate && new Date(pending.dueDate).getTime() < Date.now()) {
    return 3;
  }

  if (pending.blocksProgress) {
    return 2;
  }

  return 1;
}

function buildPendingFields(
  pending: Pick<NonNullable<PendingWithProtocol>, 'metadata' | 'description'>
) {
  const metadata = getPendingMetadata(pending.metadata);

  if (Array.isArray(metadata.fields) && metadata.fields.length > 0) {
    return metadata.fields;
  }

  if (metadata.fieldId || metadata.fieldKey || metadata.fieldLabel) {
    return [
      {
        id: String(metadata.fieldId || metadata.fieldKey || 'field'),
        key: String(metadata.fieldKey || metadata.fieldId || 'field'),
        label: String(metadata.fieldLabel || metadata.fieldKey || 'Informacao solicitada'),
        type: String(metadata.fieldType || 'text'),
        required: true,
        description: pending.description,
      },
    ];
  }

  return undefined;
}

export function serializePendingForCitizen(
  pending: NonNullable<PendingWithProtocol>
) {
  const metadata = getPendingMetadata(pending.metadata);
  const fields = buildPendingFields(pending);

  return {
    id: pending.id,
    protocolId: pending.protocolId,
    pendingType: pending.type,
    type: pending.type,
    title: pending.title,
    description: pending.description,
    status: pending.status,
    priority: inferPendingPriority(pending),
    dueDate: pending.dueDate,
    createdAt: pending.createdAt,
    resolvedAt: pending.resolvedAt,
    resolution: pending.resolution,
    blocksProgress: pending.blocksProgress,
    requiresCitizenAction: isCitizenActionPending(pending),
    metadata: {
      ...metadata,
      fields,
    },
  };
}

export async function getCitizenPendings(protocolId: string) {
  const pendings = await getProtocolPendings(protocolId);
  return pendings.map((pending) => serializePendingForCitizen(pending as any));
}

async function loadPendingWithProtocol(pendingId: string) {
  return prisma.protocolPending.findUnique({
    where: { id: pendingId },
    include: {
      protocol: {
        include: {
          citizen: true,
          service: true,
          assignedUser: true,
        },
      },
    },
  });
}

async function createPendingInteraction(
  pending: NonNullable<PendingWithProtocol>,
  type: InteractionType,
  authorType: 'CITIZEN' | 'SERVER' | 'SYSTEM',
  authorId: string | undefined,
  authorName: string,
  message: string
) {
  try {
    await interactionService.createInteraction({
      protocolId: pending.protocolId,
      type,
      authorType,
      authorId,
      authorName,
      message,
      metadata: {
        pendingId: pending.id,
        pendingType: pending.type,
      },
      isInternal: false,
    });
  } catch (error) {
    console.error('[protocol-pending.service] Failed to create interaction:', error);
  }
}

async function notifyPendingCreated(pendingId: string) {
  const pending = await loadPendingWithProtocol(pendingId);
  if (!pending?.protocol) return;

  const metadata = getPendingMetadata(pending.metadata);
  const citizenAction = isCitizenActionPending(pending);
  const creator = pending.createdBy
    ? await prisma.user.findUnique({
        where: { id: pending.createdBy },
        select: { name: true },
      }).catch(() => null)
    : null;

  await createPendingInteraction(
    pending,
    InteractionType.PENDING_CREATED,
    'SERVER',
    pending.createdBy,
    creator?.name || 'Servidor',
    `Nova pendencia registrada: ${pending.title}`
  );

  if (citizenAction) {
    await notificationService.notify({
      recipientType: 'citizen',
      recipientId: pending.protocol.citizenId,
      type: 'PROTOCOL_PENDING_CREATED',
      title: `Acao necessaria no protocolo ${pending.protocol.number}`,
      message: pending.title,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        pendingType: pending.type,
        documentType: metadata.documentType,
        fieldKey: metadata.fieldKey,
        url: `/cidadao/protocolos/${pending.protocol.id}`,
      },
      priority: pending.blocksProgress ? 'high' : 'normal',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to create citizen notification:', error);
    });

    await messageNotificationService.notifyProtocolPendingCreated(
      pending.protocol.id,
      pending.id
    ).catch((error) => {
      console.error('[protocol-pending.service] Failed to send citizen pending message:', error);
    });
  }

  if (pending.protocol.currentAssignedUserId) {
    await notificationService.notify({
      recipientType: 'user',
      recipientId: pending.protocol.currentAssignedUserId,
      type: 'PROTOCOL_PENDING_CREATED',
      title: `Pendencia registrada no protocolo ${pending.protocol.number}`,
      message: pending.title,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        url: `/admin/protocolos/${pending.protocol.id}`,
      },
      priority: pending.blocksProgress ? 'high' : 'normal',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to notify assigned server:', error);
    });
  }
}

async function notifyPendingResolved(
  pendingId: string,
  resolvedBy: string
) {
  const pending = await loadPendingWithProtocol(pendingId);
  if (!pending?.protocol) return;

  const resolvedByCitizen = resolvedBy === pending.protocol.citizenId;
  const resolverName = resolvedByCitizen
    ? pending.protocol.citizen?.name || 'Cidadao'
    : (
        await prisma.user.findUnique({
          where: { id: resolvedBy },
          select: { name: true },
        }).catch(() => null)
      )?.name || 'Servidor';

  await createPendingInteraction(
    pending,
    InteractionType.PENDING_RESOLVED,
    resolvedByCitizen ? 'CITIZEN' : 'SERVER',
    resolvedBy,
    resolverName,
    resolvedByCitizen
      ? `Pendencia respondida pelo cidadao: ${pending.title}`
      : `Pendencia resolvida pela equipe: ${pending.title}`
  );

  if (resolvedByCitizen && pending.protocol.currentAssignedUserId) {
    await notificationService.notify({
      recipientType: 'user',
      recipientId: pending.protocol.currentAssignedUserId,
      type: 'PROTOCOL_PENDING_RESOLVED',
      title: `Pendencia respondida no protocolo ${pending.protocol.number}`,
      message: `${pending.protocol.citizen?.name || 'O cidadao'} respondeu: ${pending.title}`,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        resolution: pending.resolution,
        url: `/admin/protocolos/${pending.protocol.id}`,
      },
      priority: 'high',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to notify server about citizen response:', error);
    });
  }

  if (!resolvedByCitizen) {
    await notificationService.notify({
      recipientType: 'citizen',
      recipientId: pending.protocol.citizenId,
      type: 'PROTOCOL_PENDING_RESOLVED',
      title: `Pendencia atualizada no protocolo ${pending.protocol.number}`,
      message: `A equipe marcou como resolvida: ${pending.title}`,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        url: `/cidadao/protocolos/${pending.protocol.id}`,
      },
      priority: 'normal',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to notify citizen about resolution:', error);
    });
  }
}

async function notifyPendingCancelled(
  pendingId: string,
  cancelledBy: string
) {
  const pending = await loadPendingWithProtocol(pendingId);
  if (!pending?.protocol) return;

  const resolver = await prisma.user.findUnique({
    where: { id: cancelledBy },
    select: { name: true },
  }).catch(() => null);

  await createPendingInteraction(
    pending,
    InteractionType.CANCELLATION,
    'SERVER',
    cancelledBy,
    resolver?.name || 'Servidor',
    `Pendencia cancelada: ${pending.title}`
  );

  if (isCitizenActionPending(pending)) {
    await notificationService.notify({
      recipientType: 'citizen',
      recipientId: pending.protocol.citizenId,
      type: 'PROTOCOL_PENDING_CANCELLED',
      title: `Pendencia atualizada no protocolo ${pending.protocol.number}`,
      message: `A equipe cancelou a pendencia: ${pending.title}`,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        url: `/cidadao/protocolos/${pending.protocol.id}`,
      },
      priority: 'normal',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to notify citizen about cancellation:', error);
    });
  }
}

/**
 * Cria uma nova pendencia em um protocolo
 */
export async function createPending(data: CreatePendingData) {
  const pending = await prisma.protocolPending.create({
    data: {
      protocolId: data.protocolId,
      type: data.type,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      blocksProgress: data.blocksProgress ?? true,
      metadata: data.metadata,
      createdBy: data.createdBy,
      status: PendingStatus.OPEN,
    },
    include: {
      protocol: {
        select: {
          id: true,
          number: true,
          status: true,
        },
      },
    },
  });

  await notifyPendingCreated(pending.id);

  const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
  await workflowOrchestrator.onPendingCreated(pending.id);

  return pending;
}

/**
 * Lista todas as pendencias de um protocolo
 */
export async function getProtocolPendings(
  protocolId: string,
  status?: PendingStatus
) {
  return prisma.protocolPending.findMany({
    where: {
      protocolId,
      ...(status ? { status } : {}),
    },
    orderBy: [
      { blocksProgress: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Obtem uma pendencia especifica
 */
export async function getPendingById(pendingId: string) {
  return prisma.protocolPending.findUnique({
    where: { id: pendingId },
    include: {
      protocol: true,
    },
  });
}

/**
 * Atualiza uma pendencia
 */
export async function updatePending(
  pendingId: string,
  data: UpdatePendingData
) {
  return prisma.protocolPending.update({
    where: { id: pendingId },
    data,
  });
}

/**
 * Marca pendencia como em progresso
 */
export async function startPending(pendingId: string) {
  return prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.IN_PROGRESS,
    },
  });
}

/**
 * Resolve uma pendencia
 */
export async function resolvePending(
  pendingId: string,
  resolvedBy: string,
  resolution: string
) {
  const resolved = await prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.RESOLVED,
      resolvedBy,
      resolvedAt: new Date(),
      resolution,
    },
  });

  await notifyPendingResolved(pendingId, resolvedBy);

  const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
  await workflowOrchestrator.onPendingResolved(pendingId, resolvedBy);

  return resolved;
}

/**
 * Cancela uma pendencia
 */
export async function cancelPending(
  pendingId: string,
  resolvedBy: string,
  reason: string
) {
  const cancelled = await prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.CANCELLED,
      resolvedBy,
      resolvedAt: new Date(),
      resolution: `Cancelado: ${reason}`,
    },
  });

  await notifyPendingCancelled(pendingId, resolvedBy);

  return cancelled;
}

/**
 * Verifica se ha pendencias bloqueantes abertas
 */
export async function hasBlockingPendings(protocolId: string) {
  const count = await prisma.protocolPending.count({
    where: {
      protocolId,
      blocksProgress: true,
      status: {
        in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS],
      },
    },
  });

  return count > 0;
}

/**
 * Conta pendencias por status
 */
export async function countPendingsByStatus(protocolId: string) {
  const pendings = await prisma.protocolPending.groupBy({
    by: ['status'],
    where: { protocolId },
    _count: true,
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
 * Verifica pendencias expiradas e marca como tal
 */
export async function checkExpiredPendings(protocolId: string) {
  const now = new Date();

  const expired = await prisma.protocolPending.findMany({
    where: {
      protocolId,
      status: {
        in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS],
      },
      dueDate: {
        lt: now,
      },
    },
  });

  await prisma.protocolPending.updateMany({
    where: {
      id: {
        in: expired.map((pending) => pending.id),
      },
    },
    data: {
      status: PendingStatus.EXPIRED,
    },
  });

  return expired;
}

/**
 * Deleta uma pendencia
 */
export async function deletePending(pendingId: string) {
  return prisma.protocolPending.delete({
    where: { id: pendingId },
  });
}

/**
 * Cria pendencia de documento faltante
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
    description: `E necessario enviar o documento: ${documentType}`,
    createdBy,
    dueDate,
    blocksProgress: true,
    metadata: { documentType, requiresCitizenAction: true },
  });
}

/**
 * Cria pendencia de informacao faltante
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
    blocksProgress: true,
    metadata: { requiresCitizenAction: true },
  });
}

/**
 * Cria pendencia de correcao
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
    blocksProgress: true,
    metadata: { requiresCitizenAction: true },
  });
}
