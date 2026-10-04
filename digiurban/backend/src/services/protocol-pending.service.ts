import { DocumentStatus, InteractionType, PendingStatus, PendingType, Prisma, ProtocolStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import messageNotificationService from '../lib/messages/MessageNotificationService';
import notificationService from './notification.service';
import * as interactionService from './protocol-interaction.service';
import {
  FINAL_REMINDER_DAYS_BEFORE_EXPIRY,
  PendingActionError,
  PendingReminderType,
  STALE_PENDING_DAYS,
  pickPendingReminder,
} from './pending-rules';

export interface CreatePendingData {
  protocolId: string;
  stageId?: string;
  type: PendingType;
  title: string;
  description: string;
  dueDate?: Date;
  blocksProgress?: boolean;
  requiresReview?: boolean;
  sourceType?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  dedupeKey?: string;
  metadata?: any;
  createdBy: string;
}

export interface UpdatePendingData {
  status?: PendingStatus;
  resolution?: string;
  resolvedBy?: string;
  dueDate?: Date;
}

type PendingWithProtocol = Prisma.ProtocolPendingGetPayload<{
  include: {
    protocol: {
      include: {
        citizen: true;
        service: true;
        assignedUser: true;
      };
    };
  };
}>;

export {
  PendingActionError,
  STALE_PENDING_DAYS,
  parsePendingDueDate,
  pickPendingReminder,
} from './pending-rules';
export type { PendingReminderType } from './pending-rules';

const TERMINAL_PROTOCOL_STATUSES: ProtocolStatus[] = [ProtocolStatus.CONCLUIDO, ProtocolStatus.CANCELADO];

const REMINDER_METADATA_KEY: Record<PendingReminderType, string> = {
  upcoming: 'lastUpcomingReminderAt',
  overdue: 'lastOverdueReminderAt',
  final: 'lastFinalReminderAt',
};

function assertActivePending(status: PendingStatus, action: string) {
  if (!ACTIVE_PENDING_STATUSES.includes(status)) {
    throw new PendingActionError(
      `Não é possível ${action}: a pendência já foi ${status === PendingStatus.RESOLVED ? 'resolvida' : status === PendingStatus.EXPIRED ? 'encerrada por prazo' : 'cancelada'}.`
    );
  }
}

async function closeAndContinue(
  pending: { id: string; protocolId: string; blocksProgress: boolean },
  actorId: string,
  kind: 'RESOLVED' | 'CANCELLED' | 'EXPIRED' | 'DELETED'
) {
  const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
  await workflowOrchestrator.onPendingClosed({
    protocolId: pending.protocolId,
    pendingId: pending.id,
    blocksProgress: pending.blocksProgress,
    actorId,
    kind,
  });
}

/** Documentos que o cidadão mandou como resposta desta pendência */
function getSubmittedDocumentIds(metadata: Record<string, any>): string[] {
  const ids = new Set<string>();
  if (Array.isArray(metadata.submittedDocuments)) {
    for (const item of metadata.submittedDocuments) {
      if (item && typeof item.id === 'string') ids.add(item.id);
    }
  }
  if (typeof metadata.lastSubmittedDocumentId === 'string') {
    ids.add(metadata.lastSubmittedDocumentId);
  }
  return Array.from(ids);
}

const ACTIVE_PENDING_STATUSES: PendingStatus[] = [
  PendingStatus.OPEN,
  PendingStatus.IN_PROGRESS,
  PendingStatus.UNDER_REVIEW,
];

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

function buildPendingDedupeKey(data: CreatePendingData): string | undefined {
  if (data.dedupeKey?.trim()) return data.dedupeKey.trim();

  if (data.sourceEntityType && data.sourceEntityId) {
    return [
      data.protocolId,
      data.stageId || 'no-stage',
      data.type,
      data.sourceEntityType,
      data.sourceEntityId,
    ].join(':');
  }

  return undefined;
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
    submittedAt: pending.submittedAt,
    resolvedAt: pending.resolvedAt,
    resolution: pending.resolution,
    reviewedAt: pending.reviewedAt,
    reviewedBy: pending.reviewedBy,
    reviewNotes: pending.reviewNotes,
    blocksProgress: pending.blocksProgress,
    requiresCitizenAction: isCitizenActionPending(pending),
    requiresReview: pending.requiresReview,
    stageId: pending.stageId,
    sourceType: pending.sourceType,
    sourceEntityType: pending.sourceEntityType,
    sourceEntityId: pending.sourceEntityId,
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

async function notifyPendingSubmitted(
  pendingId: string,
  submittedBy: string
) {
  const pending = await loadPendingWithProtocol(pendingId);
  if (!pending?.protocol) return;

  const submitterName = submittedBy === pending.protocol.citizenId
    ? pending.protocol.citizen?.name || 'Cidadao'
    : (
        await prisma.user.findUnique({
          where: { id: submittedBy },
          select: { name: true },
        }).catch(() => null)
      )?.name || 'Servidor';

  await createPendingInteraction(
    pending,
    InteractionType.NOTE,
    submittedBy === pending.protocol.citizenId ? 'CITIZEN' : 'SERVER',
    submittedBy,
    submitterName,
    `Resposta enviada para a pendencia: ${pending.title}`
  );

  if (pending.protocol.currentAssignedUserId) {
    await notificationService.notify({
      recipientType: 'user',
      recipientId: pending.protocol.currentAssignedUserId,
      type: 'PROTOCOL_PENDING_RESOLVED',
      title: `Resposta enviada no protocolo ${pending.protocol.number}`,
      message: `${submitterName} enviou uma resposta para: ${pending.title}`,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        resolution: pending.resolution,
        url: `/admin/protocolos/${pending.protocol.id}`,
      },
      priority: 'high',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to notify server about pending submission:', error);
    });
  }
}

async function notifyPendingReopened(
  pendingId: string,
  reopenedBy: string
) {
  const pending = await loadPendingWithProtocol(pendingId);
  if (!pending?.protocol) return;

  const reviewer = await prisma.user.findUnique({
    where: { id: reopenedBy },
    select: { name: true },
  }).catch(() => null);

  await createPendingInteraction(
    pending,
    InteractionType.NOTE,
    'SERVER',
    reopenedBy,
    reviewer?.name || 'Servidor',
    `Pendencia reenviada ao cidadao: ${pending.title}`
  );

  if (isCitizenActionPending(pending)) {
    await notificationService.notify({
      recipientType: 'citizen',
      recipientId: pending.protocol.citizenId,
      type: 'PROTOCOL_PENDING_CREATED',
      title: `Nova acao necessaria no protocolo ${pending.protocol.number}`,
      message: pending.title,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        url: `/cidadao/protocolos/${pending.protocol.id}`,
      },
      priority: pending.blocksProgress ? 'high' : 'normal',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to notify citizen about reopened pending:', error);
    });

    await messageNotificationService.notifyProtocolPendingCreated(
      pending.protocol.id,
      pending.id
    ).catch((error) => {
      console.error('[protocol-pending.service] Failed to send reopened pending message:', error);
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

async function notifyPendingReminder(
  pending: NonNullable<PendingWithProtocol>,
  reminder: PendingReminderType
) {
  if (!pending.protocol || !isCitizenActionPending(pending)) return;

  const isFinal = reminder === 'final';
  const reminderType: 'upcoming' | 'overdue' = reminder === 'upcoming' ? 'upcoming' : 'overdue';

  const dueDateLabel = pending.dueDate
    ? new Date(pending.dueDate).toLocaleDateString('pt-BR')
    : null;
  const title = isFinal
    ? `Ultimo aviso: pendencia do protocolo ${pending.protocol.number} sera encerrada em ${FINAL_REMINDER_DAYS_BEFORE_EXPIRY} dias`
    : reminderType === 'overdue'
    ? `Pendencia vencida no protocolo ${pending.protocol.number}`
    : `Pendencia aguardando resposta no protocolo ${pending.protocol.number}`;
  const message = reminderType === 'overdue'
    ? `${pending.title}${dueDateLabel ? ` (prazo original: ${dueDateLabel})` : ''}`
    : `${pending.title}${dueDateLabel ? ` (prazo: ${dueDateLabel})` : ''}`;

  await createPendingInteraction(
    pending,
    InteractionType.NOTE,
    'SYSTEM',
    undefined,
    'Sistema',
    reminderType === 'overdue'
      ? `Lembrete enviado ao cidadao para pendencia vencida: ${pending.title}`
      : `Lembrete enviado ao cidadao para pendencia em aberto: ${pending.title}`
  );

  await notificationService.notify({
    recipientType: 'citizen',
    recipientId: pending.protocol.citizenId,
    type: reminderType === 'overdue' ? 'PROTOCOL_PENDING_OVERDUE' : 'PROTOCOL_PENDING_REMINDER',
    title,
    message,
    data: {
      protocolId: pending.protocol.id,
      protocolNumber: pending.protocol.number,
      pendingId: pending.id,
      pendingType: pending.type,
      dueDate: pending.dueDate,
      url: `/cidadao/protocolos/${pending.protocol.id}`,
    },
    priority: reminderType === 'overdue' || pending.blocksProgress ? 'high' : 'normal',
  }).catch((error) => {
    console.error('[protocol-pending.service] Failed to create citizen reminder notification:', error);
  });

  if (pending.protocol.currentAssignedUserId) {
    await notificationService.notify({
      recipientType: 'user',
      recipientId: pending.protocol.currentAssignedUserId,
      type: reminderType === 'overdue' ? 'PROTOCOL_PENDING_OVERDUE' : 'PROTOCOL_PENDING_REMINDER',
      title,
      message: `${pending.protocol.citizen?.name || 'O cidadao'} ainda nao resolveu: ${pending.title}`,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        dueDate: pending.dueDate,
        url: `/admin/protocolos/${pending.protocol.id}`,
      },
      priority: reminderType === 'overdue' || pending.blocksProgress ? 'high' : 'normal',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to create server reminder notification:', error);
    });
  }

  await messageNotificationService.notifyProtocolPendingReminder(
    pending.protocol.id,
    pending.id,
    reminderType
  ).catch((error) => {
    console.error('[protocol-pending.service] Failed to send pending reminder message:', error);
  });
}

/**
 * Cria uma nova pendencia em um protocolo
 */
export async function createPending(data: CreatePendingData) {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: data.protocolId },
    select: { status: true },
  });

  if (!protocol) {
    throw new PendingActionError('Protocolo não encontrado', 404);
  }

  if (TERMINAL_PROTOCOL_STATUSES.includes(protocol.status)) {
    throw new PendingActionError('Este protocolo já foi encerrado. Reabra o protocolo antes de pedir algo ao cidadão.');
  }

  if (!Object.values(PendingType).includes(data.type)) {
    throw new PendingActionError('Tipo de pendência inválido', 400);
  }

  const metadata = getPendingMetadata(data.metadata);
  const dedupeKey = buildPendingDedupeKey(data);

  if (dedupeKey) {
    const existing = await prisma.protocolPending.findFirst({
      where: {
        protocolId: data.protocolId,
        dedupeKey,
        status: { in: ACTIVE_PENDING_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return existing;
    }
  }

  const pending = await prisma.protocolPending.create({
    data: {
      protocolId: data.protocolId,
      stageId: data.stageId,
      type: data.type,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      blocksProgress: data.blocksProgress ?? true,
      requiresReview: data.requiresReview ?? (data.type === PendingType.DOCUMENT || data.type === PendingType.CORRECTION),
      metadata,
      sourceType: data.sourceType,
      sourceEntityType: data.sourceEntityType,
      sourceEntityId: data.sourceEntityId,
      dedupeKey,
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

export async function submitPendingResponse(
  pendingId: string,
  submittedBy: string,
  resolution: string,
  metadataPatch?: Record<string, unknown>
) {
  const current = await getPendingById(pendingId);
  if (!current) {
    throw new PendingActionError('Pendência não encontrada', 404);
  }

  if (current.status !== PendingStatus.OPEN && current.status !== PendingStatus.IN_PROGRESS) {
    throw new PendingActionError(
      current.status === PendingStatus.UNDER_REVIEW
        ? 'A pendência já recebeu resposta e aguarda análise da equipe'
        : 'Pendência já foi resolvida ou cancelada'
    );
  }

  const mergedMetadata = {
    ...getPendingMetadata(current.metadata),
    ...(metadataPatch || {}),
  };

  if (current.requiresReview === false) {
    await prisma.protocolPending.update({
      where: { id: pendingId },
      data: {
        submittedAt: new Date(),
        metadata: mergedMetadata,
      },
    });

    return resolvePending(pendingId, submittedBy, resolution);
  }

  const updated = await prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.UNDER_REVIEW,
      submittedAt: new Date(),
      resolution,
      metadata: mergedMetadata,
    },
  });

  await notifyPendingSubmitted(pendingId, submittedBy);

  return updated;
}

export async function reopenPending(
  pendingId: string,
  reopenedBy: string,
  reason: string
) {
  const current = await getPendingById(pendingId);
  if (!current) {
    throw new PendingActionError('Pendência não encontrada', 404);
  }

  if (current.status !== PendingStatus.UNDER_REVIEW && current.status !== PendingStatus.RESOLVED) {
    throw new PendingActionError('Só dá para pedir novo ajuste de uma pendência respondida ou resolvida.');
  }

  if (TERMINAL_PROTOCOL_STATUSES.includes(current.protocol.status)) {
    throw new PendingActionError('Este protocolo já foi encerrado. Reabra o protocolo antes de pedir algo ao cidadão.');
  }

  // Pedir novo envio = recusar o arquivo que veio (antes o documento ficava
  // "enviado" e a análise na aba Documentos não batia com a da pendência)
  if (current.type === PendingType.DOCUMENT) {
    await rejectSubmittedDocuments(current.protocolId, getPendingMetadata(current.metadata), reopenedBy, reason);
  }

  const reopened = await prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.OPEN,
      reviewedAt: new Date(),
      reviewedBy: reopenedBy,
      reviewNotes: reason,
      resolvedAt: null,
      resolvedBy: null,
    },
  });

  await notifyPendingReopened(pendingId, reopenedBy);

  // Pendência resolvida voltando a valer: o protocolo trava de novo
  if (current.status === PendingStatus.RESOLVED) {
    const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
    await workflowOrchestrator.onPendingCreated(pendingId);
  }

  return reopened;
}

async function rejectSubmittedDocuments(
  protocolId: string,
  metadata: Record<string, any>,
  rejectedBy: string,
  reason: string
) {
  const ids = getSubmittedDocumentIds(metadata);
  if (ids.length === 0) return;

  const documents = await prisma.protocolDocument.findMany({
    where: {
      id: { in: ids },
      protocolId,
      status: { in: [DocumentStatus.UPLOADED, DocumentStatus.UNDER_REVIEW] },
    },
    select: { id: true, documentType: true },
  });

  for (const document of documents) {
    await prisma.protocolDocument.update({
      where: { id: document.id },
      data: {
        status: DocumentStatus.REJECTED,
        validatedBy: rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'DOCUMENTO_REJEITADO',
        comment: `Documento "${document.documentType}" recusado. Motivo: ${reason}`,
        userId: rejectedBy,
      },
    }).catch((error) => console.error('[protocol-pending.service] Falha ao registrar histórico:', error));
  }
}

/**
 * Resolve uma pendencia.
 *
 * Com `approveSubmittedDocuments` (análise feita pela equipe na aba
 * Pendências), os documentos enviados como resposta são APROVADOS junto —
 * antes a pendência fechava mas o documento seguia "enviado" e a etapa de
 * análise documental nunca avançava.
 */
export async function resolvePending(
  pendingId: string,
  resolvedBy: string,
  resolution: string,
  options: { approveSubmittedDocuments?: boolean } = {}
) {
  const current = await getPendingById(pendingId);
  if (!current) {
    throw new PendingActionError('Pendência não encontrada', 404);
  }

  // Idempotente: aprovar o documento já resolve a pendência
  if (current.status === PendingStatus.RESOLVED) {
    return current;
  }
  assertActivePending(current.status, 'resolver');

  const approvedDocuments =
    options.approveSubmittedDocuments && current.type === PendingType.DOCUMENT
      ? await approveSubmittedDocuments(current.protocolId, getPendingMetadata(current.metadata), resolvedBy)
      : 0;

  const resolved = await prisma.protocolPending.update({
    where: { id: pendingId },
    data: {
      status: PendingStatus.RESOLVED,
      resolvedBy,
      resolvedAt: new Date(),
      resolution,
      reviewedAt: new Date(),
      reviewedBy: resolvedBy,
    },
  });

  await notifyPendingResolved(pendingId, resolvedBy);
  await closeAndContinue(current, resolvedBy, 'RESOLVED');

  if (approvedDocuments > 0) {
    const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
    await workflowOrchestrator.advanceIfAllDocumentsApproved(current.protocolId, resolvedBy);
  }

  return resolved;
}

async function approveSubmittedDocuments(
  protocolId: string,
  metadata: Record<string, any>,
  approvedBy: string
): Promise<number> {
  const ids = getSubmittedDocumentIds(metadata);
  if (ids.length === 0) return 0;

  const documents = await prisma.protocolDocument.findMany({
    where: {
      id: { in: ids },
      protocolId,
      fileUrl: { not: null },
      status: { in: [DocumentStatus.UPLOADED, DocumentStatus.UNDER_REVIEW] },
    },
    select: { id: true },
  });

  const { approveDocument } = await import('./protocol-document.service');
  for (const document of documents) {
    // sem orquestrador: o fechamento da pendência e o avanço vêm logo depois
    await approveDocument(document.id, approvedBy, { skipWorkflow: true });
  }
  return documents.length;
}

/**
 * Cancela uma pendencia
 */
export async function cancelPending(
  pendingId: string,
  resolvedBy: string,
  reason: string
) {
  const current = await getPendingById(pendingId);
  if (!current) {
    throw new PendingActionError('Pendência não encontrada', 404);
  }
  assertActivePending(current.status, 'cancelar');

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
  // Antes o protocolo ficava parado em "Pendência" com o prazo pausado
  await closeAndContinue(current, resolvedBy, 'CANCELLED');

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
        in: ACTIVE_PENDING_STATUSES,
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
      resolvedAt: now,
      resolution: 'Pendencia encerrada: o prazo terminou sem resposta.',
    },
  });

  for (const pending of expired) {
    await closeAndContinue(pending, pending.createdBy, 'EXPIRED');
  }

  return expired;
}

export async function processPendingReminders(options?: {
  upcomingWindowHours?: number;
}) {
  const now = new Date();
  const upcomingWindowHours = options?.upcomingWindowHours ?? 48;
  const upcomingLimit = new Date(now.getTime() + upcomingWindowHours * 60 * 60 * 1000);

  const candidates = await prisma.protocolPending.findMany({
    where: {
      status: {
        in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS],
      },
      dueDate: {
        not: null,
        lte: upcomingLimit,
      },
      // protocolo encerrado não manda mais lembrete
      protocol: {
        status: { notIn: TERMINAL_PROTOCOL_STATUSES },
      },
    },
    include: {
      protocol: {
        include: {
          citizen: true,
        },
      },
    },
  });

  let upcomingSent = 0;
  let overdueSent = 0;

  for (const pending of candidates) {
    if (!pending.dueDate || !isCitizenActionPending(pending as any)) continue;

    const metadata = getPendingMetadata(pending.metadata);
    const reminder = pickPendingReminder(new Date(pending.dueDate), metadata, now, upcomingWindowHours);
    if (!reminder) continue;

    await notifyPendingReminder(pending as any, reminder);

    await prisma.protocolPending.update({
      where: { id: pending.id },
      data: {
        metadata: {
          ...metadata,
          [REMINDER_METADATA_KEY[reminder]]: now.toISOString(),
        },
      },
    });

    if (reminder === 'upcoming') upcomingSent += 1;
    else overdueSent += 1;
  }

  return {
    processed: candidates.length,
    upcomingSent,
    overdueSent,
  };
}

export async function expireStalePendings(daysOverdue: number = STALE_PENDING_DAYS) {
  const threshold = new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000);

  // Sobras de protocolos já encerrados: fecha em silêncio (sem avisar ninguém)
  await prisma.protocolPending.updateMany({
    where: {
      status: { in: ACTIVE_PENDING_STATUSES },
      protocol: { status: { in: TERMINAL_PROTOCOL_STATUSES } },
    },
    data: {
      status: PendingStatus.CANCELLED,
      resolvedAt: new Date(),
      resolution: 'Encerrada automaticamente: o protocolo já estava encerrado.',
    },
  });

  const stalePendings = await prisma.protocolPending.findMany({
    where: {
      status: {
        in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS],
      },
      dueDate: {
        lt: threshold,
      },
      protocol: {
        status: { notIn: TERMINAL_PROTOCOL_STATUSES },
      },
    },
    include: {
      protocol: {
        include: {
          citizen: true,
        },
      },
    },
  });

  for (const pending of stalePendings) {
    await prisma.protocolPending.update({
      where: { id: pending.id },
      data: {
        status: PendingStatus.EXPIRED,
        resolvedAt: new Date(),
        resolution: 'Pendencia expirada automaticamente por falta de resposta dentro do prazo.',
      },
    });

    await createPendingInteraction(
      pending as any,
      InteractionType.CANCELLATION,
      'SYSTEM',
      undefined,
      'Sistema',
      `Pendencia expirada automaticamente: ${pending.title}`
    );

    await notificationService.notify({
      recipientType: 'citizen',
      recipientId: pending.protocol.citizenId,
      type: 'PROTOCOL_PENDING_EXPIRED',
      title: `Pendencia expirada no protocolo ${pending.protocol.number}`,
      message: pending.title,
      data: {
        protocolId: pending.protocol.id,
        protocolNumber: pending.protocol.number,
        pendingId: pending.id,
        url: `/cidadao/protocolos/${pending.protocol.id}`,
      },
      priority: 'high',
    }).catch((error) => {
      console.error('[protocol-pending.service] Failed to notify citizen about expired pending:', error);
    });

    if (pending.protocol.currentAssignedUserId) {
      await notificationService.notify({
        recipientType: 'user',
        recipientId: pending.protocol.currentAssignedUserId,
        type: 'PROTOCOL_PENDING_EXPIRED',
        title: `Pendencia sem resposta no protocolo ${pending.protocol.number}`,
        message: `${pending.protocol.citizen?.name || 'O cidadao'} nao respondeu: ${pending.title}. O protocolo voltou para a equipe decidir.`,
        data: {
          protocolId: pending.protocol.id,
          protocolNumber: pending.protocol.number,
          pendingId: pending.id,
          url: `/admin/protocolos/${pending.protocol.id}`,
        },
        priority: 'high',
      }).catch((error) => {
        console.error('[protocol-pending.service] Failed to notify server about expired pending:', error);
      });
    }

    // Antes o protocolo ficava parado em "Pendência" com o prazo pausado
    await closeAndContinue(pending, pending.createdBy, 'EXPIRED');
  }

  return {
    expiredCount: stalePendings.length,
  };
}

/**
 * Deleta uma pendencia
 */
export async function deletePending(pendingId: string, deletedBy: string) {
  const deleted = await prisma.protocolPending.delete({
    where: { id: pendingId },
  });

  if (ACTIVE_PENDING_STATUSES.includes(deleted.status)) {
    await closeAndContinue(deleted, deletedBy, 'DELETED');
  }

  return deleted;
}

/**
 * Cria pendencia de documento faltante
 */
export async function createDocumentPending(
  protocolId: string,
  documentType: string,
  createdBy: string,
  dueDate?: Date,
  options: {
    stageId?: string;
    documentId?: string;
    sourceType?: string;
  } = {}
) {
  return createPending({
    protocolId,
    stageId: options.stageId,
    type: PendingType.DOCUMENT,
    title: `Documento pendente: ${documentType}`,
    description: `E necessario enviar o documento: ${documentType}`,
    createdBy,
    dueDate,
    blocksProgress: true,
    requiresReview: true,
    sourceType: options.sourceType || 'DOCUMENT',
    sourceEntityType: 'DOCUMENT',
    sourceEntityId: options.documentId || documentType,
    dedupeKey: `${protocolId}:${options.stageId || 'no-stage'}:DOCUMENT:${options.documentId || documentType}`,
    metadata: {
      documentId: options.documentId,
      documentType,
      documentLabel: documentType,
      requiresCitizenAction: true,
    },
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
  dueDate?: Date,
  options: {
    stageId?: string;
    fieldId?: string;
    fieldKey?: string;
    fieldLabel?: string;
    fieldType?: string;
    sourceType?: string;
  } = {}
) {
  return createPending({
    protocolId,
    stageId: options.stageId,
    type: PendingType.INFORMATION,
    title,
    description,
    createdBy,
    dueDate,
    blocksProgress: true,
    requiresReview: true,
    sourceType: options.sourceType || 'STAGE_VALIDATION',
    sourceEntityType: options.fieldId || options.fieldKey ? 'DATA_FIELD' : undefined,
    sourceEntityId: options.fieldId || options.fieldKey,
    dedupeKey: options.fieldId || options.fieldKey
      ? `${protocolId}:${options.stageId || 'no-stage'}:INFORMATION:${options.fieldId || options.fieldKey}`
      : undefined,
    metadata: {
      requiresCitizenAction: true,
      fieldId: options.fieldId,
      fieldKey: options.fieldKey,
      fieldLabel: options.fieldLabel,
      fieldType: options.fieldType || 'text',
      fields: options.fieldId || options.fieldKey
        ? [
            {
              id: String(options.fieldId || options.fieldKey),
              key: String(options.fieldKey || options.fieldId),
              label: String(options.fieldLabel || title),
              type: String(options.fieldType || 'text'),
              required: true,
              description,
            },
          ]
        : undefined,
    },
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
  dueDate?: Date,
  options: {
    stageId?: string;
    fieldId?: string;
    fieldKey?: string;
    fieldLabel?: string;
    fieldType?: string;
    sourceType?: string;
  } = {}
) {
  return createPending({
    protocolId,
    stageId: options.stageId,
    type: PendingType.CORRECTION,
    title,
    description,
    createdBy,
    dueDate,
    blocksProgress: true,
    requiresReview: true,
    sourceType: options.sourceType || 'DATA_FIELD',
    sourceEntityType: options.fieldId || options.fieldKey ? 'DATA_FIELD' : undefined,
    sourceEntityId: options.fieldId || options.fieldKey,
    dedupeKey: options.fieldId || options.fieldKey
      ? `${protocolId}:${options.stageId || 'no-stage'}:CORRECTION:${options.fieldId || options.fieldKey}`
      : undefined,
    metadata: {
      requiresCitizenAction: true,
      fieldId: options.fieldId,
      fieldKey: options.fieldKey,
      fieldLabel: options.fieldLabel,
      fieldType: options.fieldType || 'text',
      fields: options.fieldId || options.fieldKey
        ? [
            {
              id: String(options.fieldId || options.fieldKey),
              key: String(options.fieldKey || options.fieldId),
              label: String(options.fieldLabel || title),
              type: String(options.fieldType || 'text'),
              required: true,
              description,
            },
          ]
        : undefined,
    },
  });
}
