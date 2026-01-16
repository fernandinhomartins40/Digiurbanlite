// ============================================================
// UNIFIED PROTOCOL SERVICE
// ============================================================
// Serviço unificado para gerenciamento de protocolos COM_DADOS
// Consolida lógica de aprovação, auditoria e histórico de campos

import { prisma } from '../lib/prisma';
import { DataFieldStatus } from '@prisma/client';
import * as pendingService from './protocol-pending.service';
import * as interactionService from './protocol-interaction.service';

// ============================================================
// TYPES
// ============================================================

export interface UnifiedField {
  id: string;
  key: string;
  label: string;
  value: any;
  type: string | null;
  required: boolean;
  approval: {
    status: DataFieldStatus;
    validatedBy: string | null;
    validatedAt: Date | null;
    rejectionReason: string | null;
    version: number;
    history: ApprovalHistoryItem[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalHistoryItem {
  id: string;
  action: string;
  timestamp: Date;
  actor: string;
  actorName?: string;
  reason?: string;
  previousValue?: string;
  newValue?: string;
}

export interface UnifiedDataProtocol {
  protocolId: string;
  protocolNumber: string;
  protocolStatus: string;
  moduleType: string | null;
  moduleName: string | null;
  fields: UnifiedField[];
  entityMeta: {
    createdAt: Date;
    approvedAt: string | null;
    approvedBy: string | null;
    isActive: boolean;
    status: string;
  };
  currentStage?: any;
  stages: any[];
  sla?: any;
  documents: any[];
  linkedCitizens: any[];
  location?: {
    latitude: number;
    longitude: number;
    address: string | null;
    source: string;
  };
}

export interface ApproveFieldInput {
  protocolId: string;
  fieldKey: string;
  validatedBy: string;
  comment?: string;
}

export interface RejectFieldInput {
  protocolId: string;
  fieldKey: string;
  validatedBy: string;
  rejectionReason: string;
}

export interface CorrectFieldInput {
  protocolId: string;
  fieldKey: string;
  newValue: string;
  correctedBy: string;
}

export interface BulkApproveInput {
  protocolId: string;
  fieldKeys: string[];
  validatedBy: string;
}

export interface FieldsStats {
  total: number;
  required: number;
  optional: number;
  pending: number;
  approved: number;
  rejected: number;
  corrected: number;
  underReview: number;
  allRequiredApproved: boolean;
  percentageApproved: number;
}

// ============================================================
// MAIN SERVICE
// ============================================================

/**
 * Obter protocolo com todas as informações consolidadas
 */
export async function getUnifiedProtocol(protocolId: string): Promise<UnifiedDataProtocol> {
  const protocol: any = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      citizen: true,
      service: true,
      dataFields: {
        include: {
          approvals: {
            include: {
              approvedByUser: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { timestamp: 'desc' }
          },
          changes: {
            include: {
              actorUser: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { timestamp: 'desc' }
          }
        }
      },
      stages: {
        orderBy: { stageOrder: 'asc' }
      },
      sla: true,
      citizenLinks: {
        include: {
          linkedCitizen: true
        }
      }
    }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // Construir estrutura unificada de campos
  const unifiedFields: UnifiedField[] = protocol.dataFields.map((df: any) => ({
    id: df.id,
    key: df.fieldKey,
    label: df.fieldLabel,
    value: df.fieldValue,
    type: df.fieldType,
    required: df.isRequired,
    approval: {
      status: df.status,
      validatedBy: df.validatedBy,
      validatedAt: df.validatedAt,
      rejectionReason: df.rejectionReason,
      version: df.version,
      history: df.approvals.map((approval: any) => ({
        id: approval.id,
        action: approval.action,
        timestamp: approval.timestamp,
        actor: approval.approvedBy,
        actorName: approval.approvedByUser.name,
        reason: approval.reason || undefined,
        previousValue: approval.previousValue || undefined,
        newValue: approval.newValue || undefined
      }))
    },
    createdAt: df.createdAt,
    updatedAt: df.updatedAt
  }));

  // Extrair metadados da entidade virtual
  const customData = protocol.customData as Record<string, any> || {};
  const meta = customData._meta || {};

  return {
    protocolId: protocol.id,
    protocolNumber: protocol.number,
    protocolStatus: protocol.status,
    moduleType: protocol.moduleType,
    moduleName: protocol.service?.name || null,
    fields: unifiedFields,
    entityMeta: {
      createdAt: protocol.createdAt,
      approvedAt: meta.approvedAt || null,
      approvedBy: meta.approvedBy || null,
      isActive: meta.isActive || false,
      status: meta.status || 'PENDING_APPROVAL'
    },
    currentStage: protocol.stages.find((s: any) => s.status === 'IN_PROGRESS'),
    stages: protocol.stages,
    sla: protocol.sla,
    documents: protocol.documents,
    linkedCitizens: protocol.citizenLinks.map((link: any) => ({
      id: link.id,
      linkType: link.linkType,
      linkedCitizen: link.linkedCitizen
    })),
    location: protocol.latitude && protocol.longitude ? {
      latitude: protocol.latitude,
      longitude: protocol.longitude,
      address: protocol.address,
      source: protocol.locationType || 'UNKNOWN'
    } : undefined
  };
}

/**
 * Aprovar campo e verificar se todos obrigatórios estão aprovados
 */
export async function approveField(input: ApproveFieldInput) {
  const { protocolId, fieldKey, validatedBy, comment } = input;

  const field = await prisma.protocolDataField.findUnique({
    where: { protocolId_fieldKey: { protocolId, fieldKey } }
  });

  if (!field) {
    throw new Error('Campo não encontrado');
  }

  // Atualizar campo para APPROVED
  await prisma.protocolDataField.update({
    where: { id: field.id },
    data: {
      status: 'APPROVED',
      validatedBy,
      validatedAt: new Date()
    }
  });

  // Registrar aprovação no histórico
  await prisma.fieldApproval.create({
    data: {
      fieldId: field.id,
      action: 'approve',
      timestamp: new Date(),
      approvedBy: validatedBy,
      reason: comment,
      newValue: field.fieldValue
    }
  });

  // Registrar mudança de status
  await prisma.fieldChange.create({
    data: {
      fieldId: field.id,
      changeType: 'status_changed',
      timestamp: new Date(),
      oldValue: field.status,
      newValue: 'APPROVED',
      actor: validatedBy
    }
  });

  // Verificar se todos obrigatórios estão aprovados
  const requiredFields = await prisma.protocolDataField.findMany({
    where: { protocolId, isRequired: true }
  });

  const allApproved = requiredFields.every(f => f.status === 'APPROVED' || f.id === field.id);

  if (allApproved) {
    // Ativar entidade virtual
    await activateVirtualEntity(protocolId, validatedBy);

    // Criar interação
    await interactionService.createInteraction({
      protocolId,
      type: 'STATUS_CHANGED',
      authorType: 'SYSTEM',
      authorName: 'Sistema',
      message: `✅ Todos os campos obrigatórios foram aprovados! Cadastro ativado.`,
      isInternal: false
    });
  }

  return { success: true, allApproved };
}

/**
 * Rejeitar campo e criar pendência
 */
export async function rejectField(input: RejectFieldInput) {
  const { protocolId, fieldKey, validatedBy, rejectionReason } = input;

  const field = await prisma.protocolDataField.findUnique({
    where: { protocolId_fieldKey: { protocolId, fieldKey } },
    include: { protocol: true }
  });

  if (!field) {
    throw new Error('Campo não encontrado');
  }

  // Atualizar campo para REJECTED
  await prisma.protocolDataField.update({
    where: { id: field.id },
    data: {
      status: 'REJECTED',
      validatedBy,
      validatedAt: new Date(),
      rejectedAt: new Date(),
      rejectionReason
    }
  });

  // Registrar rejeição no histórico
  await prisma.fieldApproval.create({
    data: {
      fieldId: field.id,
      action: 'reject',
      timestamp: new Date(),
      approvedBy: validatedBy,
      reason: rejectionReason,
      previousValue: field.fieldValue
    }
  });

  // Registrar mudança de status
  await prisma.fieldChange.create({
    data: {
      fieldId: field.id,
      changeType: 'status_changed',
      timestamp: new Date(),
      oldValue: field.status,
      newValue: 'REJECTED',
      actor: validatedBy
    }
  });

  // Criar pendência automática para cidadão corrigir
  await pendingService.createPending({
    protocolId,
    type: 'DOCUMENT_REVIEW' as any, // FIELD_CORRECTION_REQUIRED não existe no enum, usar DOCUMENT_REVIEW
    title: `Campo "${field.fieldLabel}" precisa ser corrigido`,
    description: `Motivo: ${rejectionReason}`,
    createdBy: validatedBy
  });

  // Criar interação
  await interactionService.createInteraction({
    protocolId,
    type: 'COMMENT' as any, // FIELD_REJECTED não existe no enum, usar COMMENT
    authorType: 'SYSTEM',
    authorName: 'Sistema',
    message: `❌ Campo "${field.fieldLabel}" foi rejeitado. Motivo: ${rejectionReason}`,
    isInternal: false
  });

  // TODO: Implementar notificação ao cidadão quando sistema estiver disponível
  // if (field.protocol.citizenId) {
  //   await notificationService.createNotification({
  //     citizenId: field.protocol.citizenId,
  //     title: `Campo rejeitado - Protocolo ${field.protocol.number}`,
  //     message: `O campo "${field.fieldLabel}" precisa ser corrigido. Motivo: ${rejectionReason}`,
  //     type: 'PROTOCOL_UPDATE',
  //     relatedId: protocolId,
  //     priority: 'HIGH'
  //   });
  // }

  return { success: true };
}

/**
 * Corrigir campo (cidadão submete nova versão)
 */
export async function correctField(input: CorrectFieldInput) {
  const { protocolId, fieldKey, newValue, correctedBy } = input;

  const field = await prisma.protocolDataField.findUnique({
    where: { protocolId_fieldKey: { protocolId, fieldKey } }
  });

  if (!field) {
    throw new Error('Campo não encontrado');
  }

  if (field.status !== 'REJECTED') {
    throw new Error('Apenas campos rejeitados podem ser corrigidos');
  }

  const previousValue = field.fieldValue;

  // Atualizar campo
  await prisma.protocolDataField.update({
    where: { id: field.id },
    data: {
      fieldValue: newValue,
      status: 'CORRECTED',
      version: { increment: 1 },
      previousValue,
      validatedBy: null, // Reset para revalidação
      validatedAt: null,
      rejectionReason: null
    }
  });

  // Registrar correção no histórico
  await prisma.fieldApproval.create({
    data: {
      fieldId: field.id,
      action: 'corrected',
      timestamp: new Date(),
      approvedBy: correctedBy,
      previousValue,
      newValue
    }
  });

  // Registrar mudança de valor
  await prisma.fieldChange.create({
    data: {
      fieldId: field.id,
      changeType: 'value_changed',
      timestamp: new Date(),
      oldValue: previousValue,
      newValue,
      actor: correctedBy
    }
  });

  // Criar interação
  await interactionService.createInteraction({
    protocolId,
    type: 'COMMENT' as any, // FIELD_CORRECTED não existe no enum, usar COMMENT
    authorType: 'SYSTEM',
    authorName: 'Sistema',
    message: `✏️ Campo "${field.fieldLabel}" foi corrigido e aguarda nova validação.`,
    isInternal: false
  });

  return { success: true, version: field.version + 1 };
}

/**
 * Aprovar múltiplos campos de uma vez
 */
export async function bulkApproveFields(input: BulkApproveInput) {
  const { protocolId, fieldKeys, validatedBy } = input;

  const results = await Promise.allSettled(
    fieldKeys.map((fieldKey) =>
      approveField({ protocolId, fieldKey, validatedBy })
    )
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return {
    total: fieldKeys.length,
    successful,
    failed,
    results
  };
}

/**
 * Obter estatísticas de campos de um protocolo
 */
export async function getFieldsStats(protocolId: string): Promise<FieldsStats> {
  const fields = await prisma.protocolDataField.findMany({
    where: { protocolId }
  });

  const total = fields.length;
  const required = fields.filter((f) => f.isRequired).length;
  const optional = total - required;

  const pending = fields.filter((f) => f.status === 'PENDING').length;
  const approved = fields.filter((f) => f.status === 'APPROVED').length;
  const rejected = fields.filter((f) => f.status === 'REJECTED').length;
  const corrected = fields.filter((f) => f.status === 'CORRECTED').length;
  const underReview = fields.filter((f) => f.status === 'UNDER_REVIEW').length;

  const allRequiredApproved = fields
    .filter((f) => f.isRequired)
    .every((f) => f.status === 'APPROVED');

  const percentageApproved = total > 0 ? Math.round((approved / total) * 100) : 0;

  return {
    total,
    required,
    optional,
    pending,
    approved,
    rejected,
    corrected,
    underReview,
    allRequiredApproved,
    percentageApproved
  };
}

/**
 * Obter histórico completo de um campo
 */
export async function getFieldHistory(fieldId: string) {
  const approvals = await prisma.fieldApproval.findMany({
    where: { fieldId },
    include: {
      approvedByUser: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  const changes = await prisma.fieldChange.findMany({
    where: { fieldId },
    include: {
      actorUser: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  return {
    approvals: approvals.map((a) => ({
      id: a.id,
      action: a.action,
      timestamp: a.timestamp,
      actor: a.approvedByUser,
      reason: a.reason,
      previousValue: a.previousValue,
      newValue: a.newValue
    })),
    changes: changes.map((c) => ({
      id: c.id,
      changeType: c.changeType,
      timestamp: c.timestamp,
      actor: c.actorUser,
      oldValue: c.oldValue,
      newValue: c.newValue
    }))
  };
}

/**
 * Comparar versões de um campo
 */
export async function getFieldVersionComparison(protocolId: string, fieldKey: string) {
  const field = await prisma.protocolDataField.findUnique({
    where: { protocolId_fieldKey: { protocolId, fieldKey } },
    include: {
      changes: {
        where: { changeType: 'value_changed' },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          actorUser: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  if (!field) {
    throw new Error('Campo não encontrado');
  }

  return {
    current: {
      value: field.fieldValue,
      version: field.version,
      updatedAt: field.updatedAt
    },
    previous: field.previousValue ? {
      value: field.previousValue,
      version: field.version - 1
    } : null,
    history: field.changes.map((c) => ({
      timestamp: c.timestamp,
      oldValue: c.oldValue,
      newValue: c.newValue,
      actor: c.actorUser
    }))
  };
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Ativar entidade virtual (customData._meta.isActive = true)
 */
async function activateVirtualEntity(protocolId: string, approvedBy: string) {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  const customData = (protocol.customData as Record<string, any>) || {};

  await prisma.protocolSimplified.update({
    where: { id: protocolId },
    data: {
      customData: {
        ...customData,
        _meta: {
          ...(customData._meta || {}),
          isActive: true,
          status: 'ACTIVE',
          approvedAt: new Date().toISOString(),
          approvedBy
        }
      }
    }
  });
}
