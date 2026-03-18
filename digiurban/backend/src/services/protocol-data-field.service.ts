/**
 * ============================================================================
 * PROTOCOL DATA FIELD SERVICE - Sistema de Aprovação de Campos de Dados
 * ============================================================================
 *
 * Gerencia aprovação/rejeição granular de campos de dados captados em protocolos.
 * Funciona de forma similar ao sistema de documentos, com pendências automáticas.
 */

import { DataFieldStatus, ProtocolStatus, UserRole, PendingStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as pendingService from './protocol-pending.service';
import { protocolStatusEngine } from './protocol-status.engine';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateDataFieldsInput {
  protocolId: string;
  customData: Record<string, any>;
  requiredFields?: string[];
}

export interface ApproveFieldInput {
  fieldId: string;
  validatedBy: string;
  comment?: string;
}

export interface RejectFieldInput {
  fieldId: string;
  validatedBy: string;
  rejectionReason: string;
}

export interface CorrectFieldInput {
  fieldId: string;
  newValue: string;
  correctedBy: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formatar nome do campo (camelCase/snake_case → Texto Legível)
 */
function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Detectar tipo do campo baseado no valor
 */
function detectFieldType(value: any): string {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';

  const str = String(value);

  // CPF
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(str)) return 'cpf';

  // CNPJ
  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(str)) return 'cnpj';

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return 'email';

  // Telefone
  if (/^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(str)) return 'phone';

  // CEP
  if (/^\d{5}-\d{3}$/.test(str)) return 'cep';

  // Data
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return 'date';

  // URL
  if (/^https?:\/\//.test(str)) return 'url';

  // Texto longo
  if (str.length > 100) return 'textarea';

  return 'text';
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Criar campos de dados a partir do customData do protocolo
 */
export async function createDataFieldsFromCustomData(input: CreateDataFieldsInput) {
  const { protocolId, customData, requiredFields = [] } = input;

  // Lista de campos que NÃO devem ser exibidos (técnicos/calculados/IDs)
  const EXCLUDED_FIELDS = [
    'id', 'citizenId', 'serviceId', 'protocolId', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy', 'deletedAt', 'userId', 'departmentId'
  ];

  // Prefixos de campos que não devem ser exibidos
  const EXCLUDED_PREFIXES = ['_', 'citizen', 'user', 'service', 'protocol'];

  // Filtrar campos técnicos e metadados
  const dataFields = Object.entries(customData)
    .filter(([key]) => {
      // Remover campos da lista de exclusão
      if (EXCLUDED_FIELDS.includes(key)) return false;

      // Remover campos que começam com prefixos técnicos (case insensitive)
      const lowerKey = key.toLowerCase();
      if (EXCLUDED_PREFIXES.some(prefix => lowerKey.startsWith(prefix))) return false;

      return true;
    })
    .map(([key, value]) => ({
      protocolId,
      fieldKey: key,
      fieldLabel: formatFieldName(key),
      fieldValue: String(value ?? ''),
      isRequired: requiredFields.includes(key),
      fieldType: detectFieldType(value),
      status: DataFieldStatus.PENDING
    }));

  if (dataFields.length === 0) {
    console.log(`ℹ️ Protocolo ${protocolId} não possui campos de dados para criar`);
    return [];
  }

  const created = await prisma.protocolDataField.createMany({
    data: dataFields,
    skipDuplicates: true
  });

  console.log(`✅ Criados ${created.count} campos de dados para protocolo ${protocolId}`);

  return prisma.protocolDataField.findMany({
    where: { protocolId }
  });
}

/**
 * Buscar todos os campos de um protocolo
 */
export async function getProtocolDataFields(protocolId: string) {
  return prisma.protocolDataField.findMany({
    where: { protocolId },
    orderBy: [
      { isRequired: 'desc' }, // Obrigatórios primeiro
      { createdAt: 'asc' }
    ]
  });
}

/**
 * Buscar campo por ID
 */
export async function getDataFieldById(fieldId: string) {
  return prisma.protocolDataField.findUnique({
    where: { id: fieldId },
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
 * Estatísticas de campos por protocolo
 */
export async function getFieldsStatsByProtocol(protocolId: string) {
  const fields = await prisma.protocolDataField.findMany({
    where: { protocolId },
    select: { status: true, isRequired: true }
  });

  const total = fields.length;
  const required = fields.filter(f => f.isRequired).length;
  const pending = fields.filter(f => f.status === DataFieldStatus.PENDING).length;
  const approved = fields.filter(f => f.status === DataFieldStatus.APPROVED).length;
  const rejected = fields.filter(f => f.status === DataFieldStatus.REJECTED).length;
  const corrected = fields.filter(f => f.status === DataFieldStatus.CORRECTED).length;
  const underReview = fields.filter(f => f.status === DataFieldStatus.UNDER_REVIEW).length;

  const requiredApproved = fields.filter(f => f.isRequired && f.status === DataFieldStatus.APPROVED).length;
  const allRequiredApproved = required === requiredApproved;

  return {
    total,
    required,
    optional: total - required,
    pending,
    approved,
    rejected,
    corrected,
    underReview,
    allRequiredApproved,
    percentageApproved: total > 0 ? Math.round((approved / total) * 100) : 0
  };
}

// ============================================================================
// APPROVAL OPERATIONS
// ============================================================================

/**
 * Aprovar campo individual
 */
export async function approveDataField(input: ApproveFieldInput) {
  const { fieldId, validatedBy, comment } = input;

  const field = await prisma.protocolDataField.findUnique({
    where: { id: fieldId }
  });

  if (!field) {
    throw new Error('Campo não encontrado');
  }

  if (field.status === DataFieldStatus.APPROVED) {
    throw new Error('Campo já foi aprovado');
  }

  // Atualizar campo
  const updatedField = await prisma.protocolDataField.update({
    where: { id: fieldId },
    data: {
      status: DataFieldStatus.APPROVED,
      validatedBy,
      validatedAt: new Date(),
      rejectionReason: null // Limpar rejeição anterior se houver
    }
  });

  // Criar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId: field.protocolId,
      action: 'CAMPO_APROVADO',
      comment: comment || `Campo "${field.fieldLabel}" aprovado`,
      userId: validatedBy,
      metadata: {
        fieldId: fieldId,
        fieldKey: field.fieldKey,
        fieldValue: field.fieldValue
      }
    }
  });

  console.log(`✅ Campo "${field.fieldLabel}" aprovado (${field.protocolId})`);

  // Disparar evento no orquestrador
  try {
    const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
    await workflowOrchestrator.onDataFieldApproved(fieldId, validatedBy);
  } catch (error) {
    console.error('⚠️ Erro ao disparar evento de campo aprovado:', error);
  }

  // Verificar se todos os campos obrigatórios foram aprovados
  const stats = await getFieldsStatsByProtocol(field.protocolId);

  if (stats.allRequiredApproved) {
    console.log(`🎉 Todos os ${stats.required} campos obrigatórios aprovados!`);

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: field.protocolId,
        action: 'TODOS_CAMPOS_APROVADOS',
        comment: `Todos os ${stats.required} campos obrigatórios foram aprovados`,
        userId: validatedBy
      }
    });
  }

  return updatedField;
}

/**
 * Rejeitar campo e criar pendência automática
 */
export async function rejectDataField(input: RejectFieldInput) {
  const { fieldId, validatedBy, rejectionReason } = input;

  const field = await prisma.protocolDataField.findUnique({
    where: { id: fieldId }
  });

  if (!field) {
    throw new Error('Campo não encontrado');
  }

  if (!rejectionReason.trim()) {
    throw new Error('Motivo da rejeição é obrigatório');
  }

  // Atualizar campo
  const updatedField = await prisma.protocolDataField.update({
    where: { id: fieldId },
    data: {
      status: DataFieldStatus.REJECTED,
      validatedBy,
      rejectedAt: new Date(),
      rejectionReason
    }
  });

  await pendingService.createCorrectionPending(
    field.protocolId,
    `Campo Rejeitado: ${field.fieldLabel}`,
    `O campo "${field.fieldLabel}" foi rejeitado e precisa ser corrigido. Consulte os detalhes da rejeição na aba Dados.`,
    validatedBy,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    {
      fieldId,
      fieldKey: field.fieldKey,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType || undefined,
    }
  );

  console.log(`❌ Campo "${field.fieldLabel}" rejeitado (${field.protocolId})`);

  // Disparar evento no orquestrador
  try {
    const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
    await workflowOrchestrator.onDataFieldRejected(fieldId, validatedBy, rejectionReason);
  } catch (error) {
    console.error('⚠️ Erro ao disparar evento de campo rejeitado:', error);
  }

  // Mudar protocolo para ATUALIZACAO se for campo obrigatório rejeitado
  if (field.isRequired) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: field.protocolId }
    });

    if (protocol && protocol.status !== ProtocolStatus.ATUALIZACAO) {
      await protocolStatusEngine.updateStatus({
        protocolId: field.protocolId,
        newStatus: ProtocolStatus.ATUALIZACAO,
        actorRole: UserRole.ADMIN,
        actorId: validatedBy,
        comment: `Campo obrigatório "${field.fieldLabel}" rejeitado - Aguardando correção`,
        reason: rejectionReason
      });
    }
  }

  // Criar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId: field.protocolId,
      action: 'CAMPO_REJEITADO',
      comment: `Campo "${field.fieldLabel}" rejeitado. Motivo: ${rejectionReason}`,
      userId: validatedBy,
      metadata: {
        fieldId: fieldId,
        fieldKey: field.fieldKey,
        fieldValue: field.fieldValue,
        rejectionReason
      }
    }
  });

  return updatedField;
}

/**
 * Cidadão corrige campo rejeitado
 */
export async function correctDataField(input: CorrectFieldInput) {
  const { fieldId, newValue, correctedBy } = input;

  const field = await prisma.protocolDataField.findUnique({
    where: { id: fieldId }
  });

  if (!field) {
    throw new Error('Campo não encontrado');
  }

  if (field.status !== DataFieldStatus.REJECTED) {
    throw new Error('Apenas campos rejeitados podem ser corrigidos');
  }

  if (!newValue.trim()) {
    throw new Error('Novo valor é obrigatório');
  }

  // Atualizar campo com novo valor
  const updatedField = await prisma.protocolDataField.update({
    where: { id: fieldId },
    data: {
      fieldValue: newValue,
      previousValue: field.fieldValue,
      version: field.version + 1,
      status: DataFieldStatus.UNDER_REVIEW,
      rejectionReason: null
    }
  });

  console.log(`📝 Campo "${field.fieldLabel}" corrigido (versão ${updatedField.version})`);

  // Disparar evento no orquestrador
  try {
    const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
    await workflowOrchestrator.onDataFieldCorrected(fieldId, correctedBy);
  } catch (error) {
    console.error('⚠️ Erro ao disparar evento de campo corrigido:', error);
  }

  // Enviar pendências relacionadas para reanálise
  const relatedPendings = await prisma.protocolPending.findMany({
    where: {
      protocolId: field.protocolId,
      type: 'CORRECTION',
      status: { in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS] },
      metadata: {
        path: ['fieldKey'],
        equals: field.fieldKey
      }
    }
  });

  if (relatedPendings.length > 0) {
    console.log(`🔄 Enviando ${relatedPendings.length} pendência(s) para reanálise do campo "${field.fieldLabel}"`);

    for (const pending of relatedPendings) {
      await pendingService.submitPendingResponse(
        pending.id,
        correctedBy,
        `Campo corrigido pelo cidadão (versão ${updatedField.version})`,
        {
          fieldId: field.id,
          fieldKey: field.fieldKey,
          fieldLabel: field.fieldLabel,
          submittedValue: newValue,
          version: updatedField.version,
        }
      );

      console.log(`✅ Pendência "${pending.title}" enviada para reanálise`);
    }
  }

  // Criar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId: field.protocolId,
      action: 'CAMPO_CORRIGIDO',
      comment: `Campo "${field.fieldLabel}" corrigido pelo cidadão (versão ${updatedField.version})`,
      userId: correctedBy,
      metadata: {
        fieldId: fieldId,
        fieldKey: field.fieldKey,
        oldValue: field.fieldValue,
        newValue: newValue,
        version: updatedField.version
      }
    }
  });

  return updatedField;
}

/**
 * Aprovar todos os campos de um protocolo de uma vez
 */
export async function approveAllDataFields(protocolId: string, validatedBy: string) {
  const fields = await prisma.protocolDataField.findMany({
    where: {
      protocolId,
      status: { in: [DataFieldStatus.PENDING, DataFieldStatus.UNDER_REVIEW, DataFieldStatus.CORRECTED] }
    }
  });

  if (fields.length === 0) {
    throw new Error('Não há campos pendentes para aprovar');
  }

  // Aprovar todos
  await prisma.protocolDataField.updateMany({
    where: {
      protocolId,
      status: { in: [DataFieldStatus.PENDING, DataFieldStatus.UNDER_REVIEW, DataFieldStatus.CORRECTED] }
    },
    data: {
      status: DataFieldStatus.APPROVED,
      validatedBy,
      validatedAt: new Date(),
      rejectionReason: null
    }
  });

  // Criar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: 'TODOS_CAMPOS_APROVADOS',
      comment: `Todos os ${fields.length} campos foram aprovados em lote`,
      userId: validatedBy
    }
  });

  console.log(`✅ ${fields.length} campos aprovados em lote (protocolo ${protocolId})`);

  return fields.length;
}

/**
 * Deletar todos os campos de um protocolo (usado em migrations)
 */
export async function deleteProtocolDataFields(protocolId: string) {
  const result = await prisma.protocolDataField.deleteMany({
    where: { protocolId }
  });

  console.log(`🗑️ Deletados ${result.count} campos do protocolo ${protocolId}`);

  return result.count;
}
